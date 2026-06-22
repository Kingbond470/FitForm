// POST /garment — bg-removal + auto-tag. See docs/contracts/garment-contract.md
// Flow: auth -> bg-removal -> store cutout -> auto-tag -> persist -> return chips.
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { encodeBase64 } from 'https://deno.land/std@0.224.0/encoding/base64.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { GarmentResponse, WardrobeItem } from '../../../shared/types.ts';
import { removeBackground, getTags, REJECT_MESSAGES } from '../_shared/garmentTag.ts';

const BUCKET = 'wardrobe';

serve(async (req) => {
  if (req.method !== 'POST') return json({ status: 'error', reason_code: 'not_clothing', message: 'POST only' }, 405);

  // --- auth ---
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  const supa = adminClient();
  const { data: auth } = await supa.auth.getUser(token);
  const userId = auth?.user?.id;
  if (!userId) return json({ status: 'error', reason_code: 'not_clothing', message: 'Unauthorized' }, 401);

  // --- read image ---
  let image: Uint8Array;
  try {
    const form = await req.formData();
    image = new Uint8Array(await (form.get('garment_image') as File).arrayBuffer());
  } catch {
    return json({ status: 'error', reason_code: 'no_garment_detected', message: REJECT_MESSAGES.no_garment_detected }, 400);
  }

  // --- bg-removal ---
  const cutout = await removeBackground(image);
  if (!cutout) {
    return json({ status: 'error', reason_code: 'no_garment_detected', message: REJECT_MESSAGES.no_garment_detected });
  }

  // --- auto-tag the cutout ---
  const tagged = await getTags(`data:image/png;base64,${encodeBase64(cutout)}`);
  if (tagged.kind === 'reject') {
    return json({ status: 'error', reason_code: tagged.reason, message: REJECT_MESSAGES[tagged.reason] });
  }
  if (tagged.kind !== 'tags') {
    return json({ status: 'error', reason_code: 'no_garment_detected', message: REJECT_MESSAGES.no_garment_detected }, 502);
  }

  // --- store cutout (permanent) ---
  const path = `${userId}/${crypto.randomUUID()}.png`;
  const up = await supa.storage.from(BUCKET).upload(path, cutout, { contentType: 'image/png', upsert: false });
  if (up.error) return json({ status: 'error', reason_code: 'no_garment_detected', message: 'Storage failed' }, 500);
  const image_url = supa.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

  // --- persist tags ---
  const { data, error } = await supa.from('wardrobe_item')
    .insert({ user_id: userId, image_url, ...tagged.tags, tags_source: 'auto' })
    .select().single();
  if (error) return json({ status: 'error', reason_code: 'no_garment_detected', message: 'Save failed' }, 500);

  return json({ status: 'ok', item: data as WardrobeItem });
});

// --- helpers ---
function adminClient() {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
}
function json(body: GarmentResponse, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}
