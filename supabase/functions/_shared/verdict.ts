// Verdict model layer — system prompt + neutral schema, provider-agnostic call.
// See docs/contracts/scan-verdict-contract.md. Model returns structured output ONLY.
// Pure validation lives in shared/verdictValidate.ts (testable, no Deno).
import { interpret, type VerdictResult } from '../../../shared/verdictValidate.ts';
import { visionJSON, type VisionSchema } from './vision.ts';
export { interpret, RETAKE_MESSAGES } from '../../../shared/verdictValidate.ts';
export type { VerdictResult } from '../../../shared/verdictValidate.ts';

export function modelVersion(): string {
  return Deno.env.get('VISION_PROVIDER') === 'openai'
    ? Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o'
    : Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.0-flash';
}

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

// Neutral schema dialect (see vision.ts). Provider adapters handle the rest.
const SCHEMA: VisionSchema = {
  type: 'object',
  required: ['usable', 'retake_reason', 'profile'],
  properties: {
    usable: { type: 'boolean' },
    retake_reason: { type: 'string', nullable: true, enum: ['no_face', 'no_full_body', 'too_blurry', 'too_dark', 'multiple_people'] },
    profile: {
      type: 'object', nullable: true,
      required: ['face_shape', 'body_type', 'proportions', 'color_season', 'coloring', 'rules', 'headline'],
      properties: {
        face_shape: { type: 'string', enum: ['oval', 'round', 'square', 'oblong', 'heart', 'diamond', 'triangle'] },
        body_type: { type: 'string', enum: ['ectomorph', 'mesomorph', 'endomorph', 'mixed'] },
        proportions: {
          type: 'object', required: ['build', 'torso_leg_ratio', 'shoulder_waist'],
          properties: {
            build: { type: 'string', enum: ['slim', 'average', 'broad', 'athletic'] },
            torso_leg_ratio: { type: 'string', enum: ['balanced', 'long_torso', 'long_legs'] },
            shoulder_waist: { type: 'string', enum: ['balanced', 'broad_shoulder', 'narrow_shoulder'] },
          },
        },
        color_season: { type: 'string' },
        coloring: {
          type: 'object', required: ['skin_undertone', 'contrast'],
          properties: {
            skin_undertone: { type: 'string', enum: ['warm', 'cool', 'neutral'] },
            contrast: { type: 'string', enum: ['low', 'medium', 'high'] },
          },
        },
        rules: {
          type: 'array',
          items: {
            type: 'object', required: ['type', 'target', 'reason', 'category'],
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
};

// Analyze both images (raw base64 JPEG) -> validated verdict.
export async function getVerdict(faceB64: string, bodyB64: string): Promise<VerdictResult> {
  const parsed = await visionJSON(SYSTEM_PROMPT, [
    { text: 'Face photo and full-body photo follow.' },
    { image: { mime: 'image/jpeg', base64: faceB64 } },
    { image: { mime: 'image/jpeg', base64: bodyB64 } },
  ], SCHEMA);
  if (!parsed) return { kind: 'invalid' };
  return interpret(parsed);
}
