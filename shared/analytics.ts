// Funnel event vocabulary (pure, no RN/Deno) — shared by the client tracker and
// any analytics query. The funnel mirrors the PRD success metrics so each step
// is computable: install → scan → share → add item → first outfit.
// (Paywall view / purchase intentionally absent — v1 is free; add when monetized.)

export const EVENTS = {
  APP_OPEN: 'app_open',           // proxy for install (no attribution SDK in v1)
  SCAN_START: 'scan_start',
  SCAN_COMPLETE: 'scan_complete', // activation
  SCAN_RETAKE: 'scan_retake',
  VERDICT_SHARE: 'verdict_share', // share rate (the viral input)
  ITEM_ADD: 'item_add',
  OUTFIT_GENERATED: 'outfit_generated',     // wardrobe activation
  OUTFIT_INSUFFICIENT: 'outfit_insufficient',
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];

// Ordered acquisition→payoff funnel for metric computation.
export const FUNNEL: EventName[] = [
  EVENTS.APP_OPEN,
  EVENTS.SCAN_START,
  EVENTS.SCAN_COMPLETE,
  EVENTS.VERDICT_SHARE,
  EVENTS.ITEM_ADD,
  EVENTS.OUTFIT_GENERATED,
];
