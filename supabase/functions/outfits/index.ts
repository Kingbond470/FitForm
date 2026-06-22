// POST /outfits — deterministic ranker. See docs/contracts/outfits-ranker-contract.md
// NOT an LLM call. Loads tagged items + profile, ranks, persists, returns top-N distinct.
import { serve } from 'https://deno.land/std/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { rankOutfits } from '../../../shared/ranker.ts';
import type { OutfitsResponse, Occasion, StyleProfile, WardrobeItem } from '../../../shared/types.ts';

serve(async (req) => {
  const { occasion, userId } = await readBody(req);
  const supa = adminClient();

  // 1. LOAD wardrobe + latest profile.
  const [{ data: items }, { data: profileRow }] = await Promise.all([
    supa.from('wardrobe_item').select('*').eq('user_id', userId),
    supa.from('style_profile').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).single(),
  ]);
  const profile = profileRow as unknown as StyleProfile;
  const recentItemIds = await loadRecentItemIds(supa, userId); // anti-repeat history

  // 2-5. RANK (gate + score + distinctness inside ranker).
  const result = rankOutfits({ profile, items: (items ?? []) as WardrobeItem[], occasion, recentItemIds });

  if (result.status === 'insufficient') {
    return json<OutfitsResponse>({ status: 'insufficient', need: { min_items: 5, min_categories: 2 }, have: result.have });
  }

  // PERSIST returned combos (for share + anti-repeat next call).
  const version = (profileRow as any)?.model_version ?? 'unknown';
  const rows = result.outfits.map((o) => ({ user_id: userId, item_ids: o.item_ids, occasion: occasion ?? null, score: o.score, profile_version: version }));
  const { data: saved } = await supa.from('outfit').insert(rows).select();

  return json<OutfitsResponse>({ status: 'ok', outfits: (saved ?? []) as any });
});

// --- helpers ---
async function loadRecentItemIds(supa: any, userId: string): Promise<string[]> {
  const { data } = await supa.from('outfit').select('item_ids').eq('user_id', userId).order('created_at', { ascending: false }).limit(10);
  return (data ?? []).flatMap((r: any) => r.item_ids);
}
function adminClient() { return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!); }
async function readBody(_req: Request): Promise<{ occasion?: Occasion; userId: string }> { return { userId: '' }; } // TODO auth + parse
function json<T>(body: T, status = 200): Response { return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }); }
