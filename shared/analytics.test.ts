import { EVENTS, FUNNEL } from './analytics';

test('event names are unique non-empty strings', () => {
  const vals = Object.values(EVENTS);
  expect(new Set(vals).size).toBe(vals.length);
  for (const v of vals) expect(typeof v === 'string' && v.length > 0).toBe(true);
});

test('funnel is ordered acquisition -> payoff and uses real events', () => {
  expect(FUNNEL[0]).toBe(EVENTS.APP_OPEN);
  expect(FUNNEL[FUNNEL.length - 1]).toBe(EVENTS.OUTFIT_GENERATED);
  const all = new Set(Object.values(EVENTS));
  for (const e of FUNNEL) expect(all.has(e)).toBe(true);
});

test('share + activation steps present (PRD metric inputs)', () => {
  expect(FUNNEL).toContain(EVENTS.SCAN_COMPLETE); // activation
  expect(FUNNEL).toContain(EVENTS.VERDICT_SHARE);  // share rate
  expect(FUNNEL).toContain(EVENTS.OUTFIT_GENERATED); // wardrobe activation
});
