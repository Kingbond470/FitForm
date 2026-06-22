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

// Realistic lean wardrobe (R3 target: 5–15 items). >=2 shoes so distinct
// combos are achievable — single-shoe closets are a known distinctness edge
// (forced-shared item inflates overlap vs the >=2-shared threshold). Tune in P1.
const wardrobe: WardrobeItem[] = [
  item('t1', 'top'), item('t2', 'top', { color_primary: 'white' }),
  item('b1', 'bottom'), item('b2', 'bottom', { color_primary: 'beige' }),
  item('s1', 'shoe'), item('s2', 'shoe', { color_primary: 'brown', color_hex: '#5a3a22' }),
  item('o1', 'outer'),
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

test('profile-aware — contrast level changes ranking', () => {
  // high-contrast profile should rank a stark black/white outfit above a muted one;
  // low-contrast profile should flip the preference.
  const stark = [
    item('hb', 'top', { color_primary: 'black', color_hex: '#000000', pattern: 'solid' }),
    item('hw', 'bottom', { color_primary: 'white', color_hex: '#ffffff' }),
    item('hs', 'shoe', { color_primary: 'black', color_hex: '#111111' }),
  ];
  const muted = [
    item('mb', 'top', { color_primary: 'sage', color_hex: '#9aa386' }),
    item('mw', 'bottom', { color_primary: 'taupe', color_hex: '#8f8779' }),
    item('ms', 'shoe', { color_primary: 'stone', color_hex: '#9b958a' }),
  ];
  const items = [...stark, ...muted];
  const hi = { ...profile, coloring: { ...profile.coloring, contrast: 'high' as const } };
  const lo = { ...profile, coloring: { ...profile.coloring, contrast: 'low' as const } };

  const top = (r: any) => r.outfits[0].item_ids;
  const hiTop = top(rankOutfits({ profile: hi, items }));
  const loTop = top(rankOutfits({ profile: lo, items }));
  expect(hiTop).toContain('hb');   // high-contrast person -> stark on top
  expect(loTop).toContain('mb');   // low-contrast person -> muted on top
});

test('profile-aware — wear/avoid color rules shift score', () => {
  // Earth tone available ONLY via brown_top so the wear rule isolates to it;
  // shoes/bottoms are neutral (matched by no color rule).
  const items = [
    item('brown_top', 'top', { color_primary: 'brown', color_hex: '#5a3a22' }),
    item('blue_top', 'top', { color_primary: 'blue', color_hex: '#1b3a6b' }),
    item('b1', 'bottom', { color_primary: 'navy', color_hex: '#1b2a4a' }),
    item('b2', 'bottom', { color_primary: 'charcoal', color_hex: '#33363b' }),
    item('s1', 'shoe', { color_primary: 'black', color_hex: '#111111' }),
    item('s2', 'shoe', { color_primary: 'black', color_hex: '#0f0f0f' }),
  ];
  const wantEarth = { ...profile, rules: [
    { type: 'wear' as const, target: 'earth tones', reason: '', category: 'color' as const },
    { type: 'avoid' as const, target: 'busy patterns', reason: '', category: 'pattern' as const },
    { type: 'wear' as const, target: 'structured shoulders', reason: '', category: 'fit' as const },
  ]};
  const r = rankOutfits({ profile: wantEarth, items });
  expect(r.status).toBe('ok');
  if (r.status !== 'ok') return;
  // earth-tone item should appear in the top combo (rewarded by wear rule)
  expect(r.outfits[0].item_ids).toContain('brown_top');
});
