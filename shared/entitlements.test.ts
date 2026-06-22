// Lock the FREE_LAUNCH contract: everything open while the flag is on.
import { canUse, FREE_LAUNCH } from './entitlements';

test('v1 is a free launch', () => {
  expect(FREE_LAUNCH).toBe(true);
});

test('all gated features are open during free launch', () => {
  expect(canUse('outfits')).toBe(true);
  expect(canUse('wardrobe')).toBe(true);
  expect(canUse('saved_profile')).toBe(true);
});

test('open even without any entitlement object', () => {
  expect(canUse('outfits', undefined)).toBe(true);
  expect(canUse('outfits', { isPaid: false })).toBe(true);
});
