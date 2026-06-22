// Pure verdict-output validation — no Deno, no network. Testable in jest,
// shared by the scan Edge Function. Enforces contract guarantees on model output.
import type { StyleProfile, RetakeReason } from './types';

export type VerdictResult =
  | { kind: 'profile'; profile: StyleProfile }
  | { kind: 'retake'; reason: RetakeReason }
  | { kind: 'invalid' };

export function interpret(parsed: any): VerdictResult {
  if (!parsed || typeof parsed !== 'object') return { kind: 'invalid' };
  if (parsed.usable === false) {
    const reason = parsed.retake_reason as RetakeReason;
    return reason ? { kind: 'retake', reason } : { kind: 'invalid' };
  }
  const p = parsed.profile;
  if (!p || !Array.isArray(p.rules)) return { kind: 'invalid' };
  // Contract: >=3 rules, >=1 wear, >=1 avoid.
  if (p.rules.length < 3) return { kind: 'invalid' };
  if (!p.rules.some((r: any) => r.type === 'wear')) return { kind: 'invalid' };
  if (!p.rules.some((r: any) => r.type === 'avoid')) return { kind: 'invalid' };
  return { kind: 'profile', profile: p as StyleProfile };
}

export const RETAKE_MESSAGES: Record<RetakeReason, string> = {
  no_face: 'Center your face in the frame and try again.',
  no_full_body: 'Step back so your full body fits in the frame.',
  too_blurry: 'Hold steady — that shot came out blurry. Retake it.',
  too_dark: 'Find better light and try again.',
  multiple_people: 'Make sure only you are in the photo.',
};
