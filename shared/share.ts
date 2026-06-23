// Pure share helpers (no RN) — branding constants + export naming/caption.
// Used by the export ShareCard and the share action; unit-tested.
import type { StyleProfile } from './types';

export const BRANDING = {
  wordmark: 'FitForm',
  handle: '@fitform',
  tagline: 'what suits you',
} as const;

// Export canvas — portrait, matches IG/TikTok story-ish ratio (4:5).
export const EXPORT_SIZE = { width: 1080, height: 1350 } as const;

export const SHARE_DIALOG_TITLE = 'Share your verdict';

// Deterministic file name (seed keeps it testable / collision-free).
export function exportFileName(seed: string): string {
  const safe = seed.replace(/[^a-z0-9]/gi, '').slice(0, 12) || 'verdict';
  return `fitform-verdict-${safe}.png`;
}

// Short caption used as the share-sheet dialog subtitle where supported.
export function shareCaption(profile: StyleProfile): string {
  return `My ${profile.color_season.replace(/_/g, ' ')} verdict from ${BRANDING.wordmark} — ${BRANDING.tagline}.`;
}
