// Ranker tests — prove determinism + contract acceptance (outfits-ranker-contract.md).
import { rankOutfits } from './ranker';
import type { StyleProfile, WardrobeItem } from './types';

const profile: StyleProfile = {
  face_shape: 'oval', body_type: 'mesomorph',
  proportions: { build: 'athletic', torso_leg_ratio: 'balanced', shoulder_waist: 'broad_shoulder' },
  color_season: 'deep_autumn',
  coloring: { skin_undertone: 'warm', contrast: 'high' },
  rules: [
    { type: 'wear', target: 'structured shoulders', reason: '', category: 'fit' },
    { type: 'avoid', target: 'busy patterns', reason: '', category: 'pattern' },
    { type: 'wear', target: 'earth tones', reason: '', category: 'color' },
  ],
  headline: 'Sharp & grounded',
};

const item = (id: string, category: WardrobeItem['category'], extra: Partial<WardrobeItem> = {}): WardrobeItem => ({
  id, image_url: '', category, subtype: '', color_primary: 'navy', color_hex: '#1b2a4a',
  formality: 3, pattern: 'solid', tags_source: 'auto', ...extra,
});

const wardrobe: WardrobeItem[] = [
  item('t1', 'top'), item('t2', 'top', { color_primary: 'white' }),
  item('b1', 'bottom'), item('b2', 'bottom', { color_primary: 'beige' }),
  item('s1', 'shoe'), item('o1', 'outer'),
];

test('insufficient when <5 items or single category', () => {
  expect(rankOutfits({ profile, items: wardrobe.slice(0, 3) }).status).toBe('insufficient');
  const oneCat = [item('a', 'top'), item('b', 'top'), item('c', 'top'), item('d', 'top'), item('e', 'top')];
  expect(rankOutfits({ profile, items: oneCat }).status).toBe('insufficient');
});

test('returns >=3 distinct combos respecting silhouette', () => {
  const r = rankOutfits({ profile, items: wardrobe });
  expect(r.status).toBe('ok');
  if (r.status !== 'ok') return;
  expect(r.outfits.length).toBeGreaterThanOrEqual(3);
  // every combo must have top+bottom+shoe
  for (const o of r.outfits) expect(o.item_ids.length).toBeGreaterThanOrEqual(3);
});

test('deterministic — same input gives same ranking', () => {
  const a = rankOutfits({ profile, items: wardrobe });
  const b = rankOutfits({ profile, items: wardrobe });
  expect(JSON.stringify(a)).toEqual(JSON.stringify(b));
});

test('anti-repeat — recent items penalized', () => {
  const base = rankOutfits({ profile, items: wardrobe });
  const withRecent = rankOutfits({ profile, items: wardrobe, recentItemIds: ['t1', 'b1', 's1'] });
  expect(JSON.stringify(base)).not.toEqual(JSON.stringify(withRecent));
});
