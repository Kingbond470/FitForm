// Deterministic outfit ranker — NOT an LLM. Implements outfits-ranker-contract.md.
// Pure functions, testable, reproducible. Shared so server + tests use same logic.

import type { StyleProfile, WardrobeItem, Occasion, RuleCategory } from './types';

export interface RankerWeights {
  color_harmony: number;
  formality_coherence: number;
  profile_rule_match: number;
  category_completeness: number;
  pattern_clash: number;
  repeat_penalty: number;
}

// Hand-set v1 weights; refine via P1 feedback loop (R8).
export const DEFAULT_WEIGHTS: RankerWeights = {
  color_harmony: 1.0,
  formality_coherence: 1.0,
  profile_rule_match: 1.5,
  category_completeness: 0.8,
  pattern_clash: 1.2,
  repeat_penalty: 1.0,
};

export interface RankInput {
  profile: StyleProfile;
  items: WardrobeItem[];
  occasion?: Occasion;
  recentItemIds?: string[]; // items in recently returned combos -> anti-repeat
  weights?: RankerWeights;
  topN?: number;
}

export interface ScoredOutfit {
  item_ids: string[];
  score: number;
}

const MIN_ITEMS = 5;
const MIN_CATEGORIES = 2;

export type RankResult =
  | { status: 'ok'; outfits: ScoredOutfit[] }
  | { status: 'insufficient'; have: { items: number; categories: number } };

export function rankOutfits(input: RankInput): RankResult {
  const { profile, items, occasion, recentItemIds = [], weights = DEFAULT_WEIGHTS, topN = 5 } = input;

  const categories = new Set(items.map((i) => i.category));
  if (items.length < MIN_ITEMS || categories.size < MIN_CATEGORIES) {
    return { status: 'insufficient', have: { items: items.length, categories: categories.size } };
  }

  const recent = new Set(recentItemIds);
  const candidates = buildCandidates(items);
  const scored = candidates
    .map((c) => ({ item_ids: c.map((i) => i.id), score: scoreOutfit(c, profile, occasion, recent, weights) }))
    .sort((a, b) => b.score - a.score);

  // Distinctness (PRD: no item in *every* suggestion). Greedy by score:
  //  - skip exact-duplicate combos,
  //  - cap how many returned outfits any single item may appear in.
  // Cap targets the real anti-pattern (same 1-2 items everywhere) without
  // demanding near-disjoint combos, which is impossible for thin closets.
  const maxRepeat = Math.max(2, Math.ceil(topN / 2));
  const usage = new Map<string, number>();
  const seen = new Set<string>();
  const picked: ScoredOutfit[] = [];
  for (const cand of scored) {
    if (picked.length >= topN) break;
    const key = [...cand.item_ids].sort().join('|');
    if (seen.has(key)) continue;
    if (cand.item_ids.some((id) => (usage.get(id) ?? 0) >= maxRepeat)) continue;
    picked.push(cand);
    seen.add(key);
    cand.item_ids.forEach((id) => usage.set(id, (usage.get(id) ?? 0) + 1));
  }
  return { status: 'ok', outfits: picked };
}

// Min viable silhouette: top + bottom + shoe, optional outer/accessory.
function buildCandidates(items: WardrobeItem[]): WardrobeItem[][] {
  const by = (c: string) => items.filter((i) => i.category === c);
  const tops = by('top'), bottoms = by('bottom'), shoes = by('shoe');
  const outers = [null, ...by('outer')] as (WardrobeItem | null)[];
  const out: WardrobeItem[][] = [];
  for (const t of tops) for (const b of bottoms) for (const s of shoes) for (const o of outers) {
    out.push(o ? [t, b, s, o] : [t, b, s]);
  }
  return out;
}

function scoreOutfit(
  outfit: WardrobeItem[],
  profile: StyleProfile,
  occasion: Occasion | undefined,
  recent: Set<string>,
  w: RankerWeights,
): number {
  return (
    w.color_harmony * colorHarmony(outfit, profile) +
    w.formality_coherence * formalityCoherence(outfit, occasion) +
    w.profile_rule_match * profileRuleMatch(outfit, profile) +
    w.category_completeness * categoryCompleteness(outfit) -
    w.pattern_clash * patternClash(outfit) -
    w.repeat_penalty * repeatPenalty(outfit, recent)
  );
}

// --- term implementations (v1 heuristics; tune in P1) ---

function colorHarmony(outfit: WardrobeItem[], profile: StyleProfile): number {
  // Reward items whose contrast level matches profile contrast; neutrals always safe.
  const target = profile.coloring.contrast;
  const score = outfit.reduce((acc, i) => acc + (isNeutral(i.color_primary) ? 0.5 : matchContrast(i, target)), 0);
  return score / outfit.length;
}

function formalityCoherence(outfit: WardrobeItem[], occasion?: Occasion): number {
  const vals = outfit.map((i) => i.formality);
  const variance = spread(vals);
  let base = 1 - variance / 4; // low spread = coherent
  if (occasion) {
    const want = occasion === 'casual' ? 2 : 4;
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    base -= Math.abs(avg - want) / 4; // pull toward occasion window
  }
  return clamp01(base);
}

function profileRuleMatch(outfit: WardrobeItem[], profile: StyleProfile): number {
  let s = 0;
  for (const rule of profile.rules) {
    const hit = outfit.some((i) => itemMatchesRuleTarget(i, rule.target, rule.category));
    if (rule.type === 'wear' && hit) s += 1;
    if (rule.type === 'avoid' && hit) s -= 1;
  }
  return s / Math.max(1, profile.rules.length);
}

function categoryCompleteness(outfit: WardrobeItem[]): number {
  const cats = new Set(outfit.map((i) => i.category));
  const core = (['top', 'bottom', 'shoe'] as const).every((c) => cats.has(c)) ? 1 : 0;
  const bonus = cats.has('outer') || cats.has('accessory') ? 0.2 : 0;
  return core + bonus;
}

function patternClash(outfit: WardrobeItem[]): number {
  const bold = outfit.filter((i) => i.pattern && i.pattern !== 'solid' && i.pattern !== 'textured');
  return bold.length > 1 ? bold.length - 1 : 0;
}

function repeatPenalty(outfit: WardrobeItem[], recent: Set<string>): number {
  return outfit.filter((i) => recent.has(i.id)).length / outfit.length;
}

// --- helpers ---
const NEUTRALS = new Set(['black', 'white', 'grey', 'gray', 'navy', 'beige', 'tan', 'cream', 'charcoal']);
const isNeutral = (c?: string) => !!c && NEUTRALS.has(c.toLowerCase());

// How well an item's value-contrast matches the person's contrast level.
// People read best in items whose light/dark extremeness suits their own
// contrast: high-contrast suits stark (near black/white), low suits muted.
function matchContrast(i: WardrobeItem, target: string): number {
  const L = hexLuminance(i.color_hex);          // 0 (black) .. 1 (white)
  const extreme = Math.abs(L - 0.5) * 2;         // 0 (mid) .. 1 (pure black/white)
  const want = target === 'high' ? 1 : target === 'low' ? 0 : 0.5;
  return clamp01(1 - Math.abs(extreme - want));
}

// Relative luminance from sRGB hex (#RRGGBB). Falls back to mid on bad input.
function hexLuminance(hex?: string): number {
  if (!hex || !/^#?[0-9a-fA-F]{6}$/.test(hex)) return 0.5;
  const h = hex.replace('#', '');
  const lin = (c: number) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
  const r = lin(parseInt(h.slice(0, 2), 16));
  const g = lin(parseInt(h.slice(2, 4), 16));
  const b = lin(parseInt(h.slice(4, 6), 16));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Map a free-text profile rule target onto a structured item field.
// v1 items carry color + pattern metadata only, so fit/proportion rules
// cannot be matched against items yet -> return false (item fit tags = v2).
const COLOR_FAMILIES: Record<string, string[]> = {
  earth: ['brown', 'olive', 'tan', 'beige', 'rust', 'camel', 'khaki', 'mustard', 'terracotta', 'cream'],
  warm: ['brown', 'olive', 'tan', 'rust', 'camel', 'mustard', 'orange', 'red'],
  cool: ['navy', 'blue', 'grey', 'gray', 'teal', 'charcoal'],
  bright: ['red', 'orange', 'yellow', 'pink', 'green', 'purple'],
  neutral: [...NEUTRALS],
};
function itemMatchesRuleTarget(i: WardrobeItem, target: string, cat: RuleCategory): boolean {
  const t = target.toLowerCase();
  if (cat === 'color') {
    const color = (i.color_primary ?? '').toLowerCase();
    if (color && t.includes(color)) return true;                 // direct color named
    for (const [fam, members] of Object.entries(COLOR_FAMILIES)) // family keyword
      if (t.includes(fam) && members.includes(color)) return true;
    return false;
  }
  if (cat === 'pattern') {
    const p = (i.pattern ?? '').toLowerCase();
    if (/busy|bold|loud|large/.test(t)) return p !== 'solid' && p !== 'textured';
    if (/strip/.test(t)) return p === 'striped';
    if (/check|plaid/.test(t)) return p === 'checked';
    if (/print/.test(t)) return p === 'printed';
    if (/solid|plain|minimal/.test(t)) return p === 'solid';
    return false;
  }
  // fit | proportion: no item-level fit metadata in v1 schema.
  return false;
}

function spread(v: number[]): number { return Math.max(...v) - Math.min(...v); }
function clamp01(n: number): number { return Math.max(0, Math.min(1, n)); }
