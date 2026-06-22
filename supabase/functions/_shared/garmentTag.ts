// Garment tagging — bg-removal (Photoroom) + auto-tag (OpenAI structured output).
// See docs/contracts/garment-contract.md. Vendor confirmed by Wk0 Spike A.
import { interpretTags, type TagResult } from '../../../shared/garmentValidate.ts';
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

const TAG_SCHEMA = {
  name: 'garment_tags',
  strict: true,
  schema: {
    type: 'object', additionalProperties: false,
    required: ['usable', 'reject_reason', 'tags'],
    properties: {
      usable: { type: 'boolean' },
      reject_reason: { type: ['string', 'null'], enum: ['no_garment_detected', 'multiple_garments', 'not_clothing', null] },
      tags: {
        type: ['object', 'null'], additionalProperties: false,
        required: ['category', 'subtype', 'color_primary', 'color_hex', 'formality', 'pattern'],
        properties: {
          category: { type: 'string', enum: ['top', 'bottom', 'outer', 'shoe', 'accessory'] },
          subtype: { type: 'string' },
          color_primary: { type: 'string' },
          color_hex: { type: 'string' },
          formality: { type: 'integer', minimum: 1, maximum: 5 },
          pattern: { type: 'string', enum: ['solid', 'striped', 'checked', 'printed', 'textured'] },
        },
      },
    },
  },
};

export async function getTags(cutoutDataUrl: string): Promise<TagResult> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${Deno.env.get('OPENAI_API_KEY')}` },
    body: JSON.stringify({
      model: 'gpt-4o',
      temperature: 0,
      response_format: { type: 'json_schema', json_schema: TAG_SCHEMA },
      messages: [
        { role: 'system', content: TAG_SYSTEM },
        { role: 'user', content: [{ type: 'image_url', image_url: { url: cutoutDataUrl } }] },
      ],
    }),
  });
  if (!res.ok) return { kind: 'invalid' };
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') return { kind: 'invalid' };
  let parsed: any;
  try { parsed = JSON.parse(content); } catch { return { kind: 'invalid' }; }
  return interpretTags(parsed);
}
