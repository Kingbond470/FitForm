// Garment tagging — bg-removal (Photoroom) + auto-tag (provider-agnostic vision).
// See docs/contracts/garment-contract.md. Vendor confirmed by Wk0 Spike A.
import { interpretTags, type TagResult } from '../../../shared/garmentValidate.ts';
import { visionJSON, type VisionSchema } from './vision.ts';
export { interpretTags, REJECT_MESSAGES } from '../../../shared/garmentValidate.ts';
export type { TagResult } from '../../../shared/garmentValidate.ts';

// --- Photoroom background removal -> transparent cutout PNG ---
export async function removeBackground(image: Uint8Array): Promise<Uint8Array | null> {
  const form = new FormData();
  form.append('image_file', new Blob([image]), 'item.jpg');
  const res = await fetch('https://sdk.photoroom.com/v1/segment', {
    method: 'POST',
    headers: { 'x-api-key': Deno.env.get('PHOTOROOM_API_KEY')! },
    body: form,
  });
  if (!res.ok) return null; // includes "no subject found"
  return new Uint8Array(await res.arrayBuffer());
}

const TAG_SYSTEM = `You tag a single men's garment shown on a transparent background.
Return ONLY the structured object.
- category: top|bottom|outer|shoe|accessory
- subtype: short noun e.g. "oxford shirt", "chino", "derby"
- color_primary: single common color name e.g. "navy", "olive"
- color_hex: that color as #RRGGBB
- formality: integer 1 (very casual) .. 5 (formal)
- pattern: solid|striped|checked|printed|textured
If the image shows no garment, multiple garments, or a non-clothing object,
set usable=false and give reject_reason instead of guessing.`;

const TAG_SCHEMA: VisionSchema = {
  type: 'object',
  required: ['usable', 'reject_reason', 'tags'],
  properties: {
    usable: { type: 'boolean' },
    reject_reason: { type: 'string', nullable: true, enum: ['no_garment_detected', 'multiple_garments', 'not_clothing'] },
    tags: {
      type: 'object', nullable: true,
      required: ['category', 'subtype', 'color_primary', 'color_hex', 'formality', 'pattern'],
      properties: {
        category: { type: 'string', enum: ['top', 'bottom', 'outer', 'shoe', 'accessory'] },
        subtype: { type: 'string' },
        color_primary: { type: 'string' },
        color_hex: { type: 'string' },
        formality: { type: 'integer' },
        pattern: { type: 'string', enum: ['solid', 'striped', 'checked', 'printed', 'textured'] },
      },
    },
  },
};

// cutout = transparent PNG bytes (base64).
export async function getTags(cutoutB64: string): Promise<TagResult> {
  const parsed = await visionJSON(TAG_SYSTEM, [{ image: { mime: 'image/png', base64: cutoutB64 } }], TAG_SCHEMA);
  if (!parsed) return { kind: 'invalid' };
  return interpretTags(parsed);
}
