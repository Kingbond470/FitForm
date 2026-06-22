// Pure garment auto-tag validation — no Deno/network. Testable, shared by the
// garment Edge Function. Enforces garment-contract.md guarantees on model output.
import type { WardrobeItem, ItemCategory, Pattern } from './types';

export type GarmentTags = Pick<WardrobeItem, 'category' | 'subtype' | 'color_primary' | 'color_hex' | 'formality' | 'pattern'>;

export type TagResult =
  | { kind: 'tags'; tags: GarmentTags }
  | { kind: 'reject'; reason: 'no_garment_detected' | 'multiple_garments' | 'not_clothing' }
  | { kind: 'invalid' };

const CATEGORIES: ItemCategory[] = ['top', 'bottom', 'outer', 'shoe', 'accessory'];
const PATTERNS: Pattern[] = ['solid', 'striped', 'checked', 'printed', 'textured'];

export function interpretTags(parsed: any): TagResult {
  if (!parsed || typeof parsed !== 'object') return { kind: 'invalid' };
  if (parsed.usable === false) {
    const reason = parsed.reject_reason;
    return reason ? { kind: 'reject', reason } : { kind: 'invalid' };
  }
  const t = parsed.tags;
  if (!t || typeof t !== 'object') return { kind: 'invalid' };
  if (!CATEGORIES.includes(t.category)) return { kind: 'invalid' };
  if (!PATTERNS.includes(t.pattern)) return { kind: 'invalid' };
  if (!Number.isInteger(t.formality) || t.formality < 1 || t.formality > 5) return { kind: 'invalid' };
  if (typeof t.color_hex !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(t.color_hex)) return { kind: 'invalid' };
  return {
    kind: 'tags',
    tags: {
      category: t.category,
      subtype: typeof t.subtype === 'string' ? t.subtype : '',
      color_primary: typeof t.color_primary === 'string' ? t.color_primary : '',
      color_hex: t.color_hex,
      formality: t.formality,
      pattern: t.pattern,
    },
  };
}

export const REJECT_MESSAGES: Record<Extract<TagResult, { kind: 'reject' }>['reason'], string> = {
  no_garment_detected: 'No garment found. Center one item in the frame.',
  multiple_garments: 'Multiple items detected. Photograph one garment at a time.',
  not_clothing: "That doesn't look like clothing. Try a garment photo.",
};
