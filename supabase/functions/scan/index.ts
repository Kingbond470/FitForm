// POST /scan — verdict pipeline. See docs/contracts/scan-verdict-contract.md
// Flow: auth -> cheap gate -> vision LLM (structured) -> validate -> persist.
// Raw images are processed in-memory and never persisted (strongest privacy
// posture; transient-bucket retention only needed if we later add server retries).
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { encodeBase64 } from 'https://deno.land/std@0.224.0/encoding/base64.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { ScanResponse } from '../../../shared/types.ts';
import { getVerdict, MODEL_VERSION, RETAKE_MESSAGES } from '../_shared/verdict.ts';

const MIN_BYTES = 3000; // obvious-junk guard before spending a model call

serve(async (req) => {
  if (req.method !== 'POST') return json({ status: 'error', retryable: false } as ScanResponse, 405);

  // --- auth ---
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  const supa = adminClient();
  const { data: auth } = await supa.auth.getUser(token);
  const userId = auth?.user?.id;
  if (!userId) return json({ status: 'error', retryable: false } as ScanResponse, 401);

  // --- read images ---
  let face: Uint8Array, body: Uint8Array;
  try {
    const form = await req.formData();
    face = new Uint8Array(await (form.get('face_image') as File).arrayBuffer());
    body = new Uint8Array(await (form.get('body_image') as File).arrayBuffer());
  } catch {
    return json({ status: 'error', retryable: true } as ScanResponse, 400);
  }

  // --- cheap gate (no model call on obvious junk) ---
  if (face.byteLength < MIN_BYTES) return json({ status: 'retake', reason_code: 'no_face', message: RETAKE_MESSAGES.no_face });
  if (body.byteLength < MIN_BYTES) return json({ status: 'retake', reason_code: 'no_full_body', message: RETAKE_MESSAGES.no_full_body });

  // --- vision LLM (structured), validate, one retry on invalid ---
  const faceUrl = dataUrl(face);
  const bodyUrl = dataUrl(body);
  let result = await getVerdict(faceUrl, bodyUrl);
  if (result.kind === 'invalid') result = await getVerdict(faceUrl, bodyUrl);

  if (result.kind === 'retake') {
    return json({ status: 'retake', reason_code: result.reason, message: RETAKE_MESSAGES[result.reason] });
  }
  if (result.kind !== 'profile') {
    return json({ status: 'error', retryable: true } as ScanResponse, 502);
  }

  // --- persist profile (raw images discarded with this scope) ---
  const { profile } = result;
  const { error } = await supa.from('style_profile').insert({
    user_id: userId,
    face_shape: profile.face_shape,
    body_type: profile.body_type,
    proportions: profile.proportions,
    color_season: profile.color_season,
    coloring: profile.coloring,
    rules: profile.rules,
    headline: profile.headline,
    model_version: MODEL_VERSION,
  });
  if (error) return json({ status: 'error', retryable: true } as ScanResponse, 500);

  return json({ status: 'ok', model_version: MODEL_VERSION, profile } as ScanResponse);
});

// --- helpers ---
function dataUrl(bytes: Uint8Array): string {
  return `data:image/jpeg;base64,${encodeBase64(bytes)}`;
}
function adminClient() {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
}
function json(body: ScanResponse, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}
