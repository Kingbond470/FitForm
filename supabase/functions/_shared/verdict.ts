// Verdict model layer — system prompt, JSON schema, OpenAI call.
// See docs/contracts/scan-verdict-contract.md. Model returns structured output ONLY.
// Pure validation lives in shared/verdictValidate.ts (testable, no Deno).
import { interpret, type VerdictResult } from '../../../shared/verdictValidate.ts';
export { interpret, RETAKE_MESSAGES } from '../../../shared/verdictValidate.ts';
export type { VerdictResult } from '../../../shared/verdictValidate.ts';

export const MODEL = 'gpt-4o';
export const MODEL_VERSION = 'gpt-4o-2024-08-06';

// Encoded styling rules + hard safety constraints. Model never freestyles.
const SYSTEM_PROMPT = `You are a men's style analyst. Analyze the provided face and full-body photos.

Apply established styling theory:
- PROPORTION: balance shoulder/waist/torso/leg ratios.
- COLOR THEORY: map skin undertone + contrast to a seasonal palette; recommend
  harmonizing colors, flag clashing ones.
- FIT-FOR-BODY: fit guidance specific to the detected build.

Output ONLY the structured object. Provide >=3 rules with at least one 'wear' and
one 'avoid'. Each rule's category must be one of fit|color|proportion|pattern.

SAFETY (hard constraints):
- Constructive, styling-focused ONLY.
- NEVER appearance-shaming; NEVER judge attractiveness or weight.
- NEVER medical/health claims or body-image framing.
- Frame every 'avoid' as a styling choice, not a personal flaw.
- If the photos are insufficient to judge confidently (no clear face, no full body,
  multiple people, too dark/blurry), set usable=false and give a retake_reason
  instead of guessing. Do NOT fabricate a profile.`;

// Strict json_schema: always-present fields, nullable where not applicable.
const SCHEMA = {
  name: 'style_verdict',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['usable', 'retake_reason', 'profile'],
    properties: {
      usable: { type: 'boolean' },
      retake_reason: { type: ['string', 'null'], enum: ['no_face', 'no_full_body', 'too_blurry', 'too_dark', 'multiple_people', null] },
      profile: {
        type: ['object', 'null'],
        additionalProperties: false,
        required: ['face_shape', 'body_type', 'proportions', 'color_season', 'coloring', 'rules', 'headline'],
        properties: {
          face_shape: { type: 'string', enum: ['oval', 'round', 'square', 'oblong', 'heart', 'diamond', 'triangle'] },
          body_type: { type: 'string', enum: ['ectomorph', 'mesomorph', 'endomorph', 'mixed'] },
          proportions: {
            type: 'object', additionalProperties: false,
            required: ['build', 'torso_leg_ratio', 'shoulder_waist'],
            properties: {
              build: { type: 'string', enum: ['slim', 'average', 'broad', 'athletic'] },
              torso_leg_ratio: { type: 'string', enum: ['balanced', 'long_torso', 'long_legs'] },
              shoulder_waist: { type: 'string', enum: ['balanced', 'broad_shoulder', 'narrow_shoulder'] },
            },
          },
          color_season: { type: 'string' },
          coloring: {
            type: 'object', additionalProperties: false,
            required: ['skin_undertone', 'contrast'],
            properties: {
              skin_undertone: { type: 'string', enum: ['warm', 'cool', 'neutral'] },
              contrast: { type: 'string', enum: ['low', 'medium', 'high'] },
            },
          },
          rules: {
            type: 'array',
            items: {
              type: 'object', additionalProperties: false,
              required: ['type', 'target', 'reason', 'category'],
              properties: {
                type: { type: 'string', enum: ['wear', 'avoid'] },
                target: { type: 'string' },
                reason: { type: 'string' },
                category: { type: 'string', enum: ['fit', 'color', 'proportion', 'pattern'] },
              },
            },
          },
          headline: { type: 'string' },
        },
      },
    },
  },
};

// Call OpenAI with both images; parse + validate structured output.
export async function getVerdict(faceDataUrl: string, bodyDataUrl: string): Promise<VerdictResult> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.2,
      response_format: { type: 'json_schema', json_schema: SCHEMA },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Face photo and full-body photo follow.' },
            { type: 'image_url', image_url: { url: faceDataUrl } },
            { type: 'image_url', image_url: { url: bodyDataUrl } },
          ],
        },
      ],
    }),
  });

  if (!res.ok) return { kind: 'invalid' };
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') return { kind: 'invalid' };

  let parsed: any;
  try { parsed = JSON.parse(content); } catch { return { kind: 'invalid' }; }
  return interpret(parsed);
}
