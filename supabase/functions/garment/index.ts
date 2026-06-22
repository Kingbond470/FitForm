// POST /garment — bg-removal + auto-tag. See docs/contracts/garment-contract.md
// Flow: upload -> bg-removal (hosted) -> auto-tag -> store cutout+tags -> return editable chips.
import { serve } from 'https://deno.land/std/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { GarmentResponse, WardrobeItem } from '../../../shared/types.ts';

serve(async (req) => {
  const { image, userId } = await readMultipart(req);

  // 2. BG-REMOVAL — hosted vendor (Photoroom/remove.bg, Wk0 spike picks).
  const cutout = await removeBackground(image); // TODO
  if (!cutout) {
    return json<GarmentResponse>({ status: 'error', reason_code: 'no_garment_detected', message: 'No garment found. Center one item in frame.' });
  }

  // 3. AUTO-TAG.
  const tags = await autoTag(cutout); // TODO: vision/classifier -> category,subtype,color,formality,pattern

  // 4. STORE cutout (permanent) + tags.
  const supa = adminClient();
  const image_url = await storeCutout(supa, userId, cutout); // TODO
  const { data } = await supa.from('wardrobe_item')
    .insert({ user_id: userId, image_url, ...tags, tags_source: 'auto' })
    .select().single();

  // 5. RETURN editable chips.
  return json<GarmentResponse>({ status: 'ok', item: data as WardrobeItem });
});

// --- stubs (Wk0 spike + Wk4 impl) ---
async function removeBackground(_img: Uint8Array): Promise<Uint8Array | null> { return new Uint8Array(); } // TODO vendor
async function autoTag(_cutout: Uint8Array): Promise<Partial<WardrobeItem>> {
  // TODO: category+color accuracy >=85% (ranker-critical). Fallback: fewer auto-fields if spike fails.
  return { category: 'top', subtype: '', color_primary: '', color_hex: '#000000', formality: 3, pattern: 'solid' };
}
async function storeCutout(_supa: any, _userId: string, _cutout: Uint8Array): Promise<string> { return ''; }

// --- infra ---
function adminClient() { return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!); }
async function readMultipart(_req: Request): Promise<{ image: Uint8Array; userId: string }> { return { image: new Uint8Array(), userId: '' }; }
function json<T>(body: T, status = 200): Response { return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }); }
