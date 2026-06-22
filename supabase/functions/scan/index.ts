// POST /scan — verdict pipeline. See docs/contracts/scan-verdict-contract.md
// Flow: quality gate -> vision LLM (structured JSON) -> validate -> persist -> purge raw <24h.
import { serve } from 'https://deno.land/std/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { ScanResponse, StyleProfile } from '../../../shared/types.ts';

const MODEL_VERSION = 'gpt-4o-2026-XX';

serve(async (req) => {
  const { faceImage, bodyImage, userId } = await readMultipart(req);

  // 1. QUALITY GATE — cheap CV, NO model call on fail.
  const gate = await qualityGate(faceImage, bodyImage);
  if (!gate.ok) {
    return json<ScanResponse>({ status: 'retake', reason_code: gate.reason, message: gate.message });
  }

  // 2. VISION LLM — structured output, encoded styling rules + safety guardrails.
  let profile: StyleProfile | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    const raw = await callVisionModel(faceImage, bodyImage); // TODO: OpenAI structured-output call w/ system prompt
    profile = validateProfile(raw); // 3. VALIDATE schema
    if (profile) break;
  }
  if (!profile) return json<ScanResponse>({ status: 'error', retryable: true });

  // 4. PERSIST profile, purge raw images.
  const supa = adminClient();
  await supa.from('style_profile').insert({ user_id: userId, ...profile, model_version: MODEL_VERSION });
  await purgeRaw(faceImage, bodyImage); // transient bucket TTL also enforces <24h

  // 5. RETURN
  return json<ScanResponse>({ status: 'ok', model_version: MODEL_VERSION, profile });
});

// --- stubs (Wk1 impl) ---
async function qualityGate(_f: Uint8Array, _b: Uint8Array): Promise<{ ok: true } | { ok: false; reason: any; message: string }> {
  // TODO: face-detect on face img, full-body-in-frame on body img, blur+luma thresholds.
  return { ok: true };
}
async function callVisionModel(_f: Uint8Array, _b: Uint8Array): Promise<unknown> {
  // TODO: OpenAI multimodal, response_format=json_schema, low temp, system prompt from contract.
  return {};
}
function validateProfile(raw: unknown): StyleProfile | null {
  // TODO: schema validate; enforce rules>=3, >=1 wear, >=1 avoid. Return null if invalid.
  return null;
}
async function purgeRaw(_f: Uint8Array, _b: Uint8Array): Promise<void> { /* TODO: delete from raw-transient bucket */ }

// --- infra helpers ---
function adminClient() {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
}
async function readMultipart(_req: Request): Promise<{ faceImage: Uint8Array; bodyImage: Uint8Array; userId: string }> {
  // TODO: parse multipart + auth JWT -> userId
  return { faceImage: new Uint8Array(), bodyImage: new Uint8Array(), userId: '' };
}
function json<T>(body: T, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}
