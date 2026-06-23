import { exportFileName, shareCaption, BRANDING, EXPORT_SIZE } from './share';
import type { StyleProfile } from './types';

const profile = { color_season: 'deep_autumn' } as StyleProfile;

test('export file name is safe + deterministic', () => {
  expect(exportFileName('abc123')).toBe('fitform-verdict-abc123.png');
  expect(exportFileName('a/b c!@#')).toBe('fitform-verdict-abc.png'); // strips unsafe chars
  expect(exportFileName('')).toBe('fitform-verdict-verdict.png');     // fallback
});

test('caption includes brand + readable season', () => {
  const cap = shareCaption(profile);
  expect(cap).toContain(BRANDING.wordmark);
  expect(cap).toContain('deep autumn'); // underscores normalized
});

test('export canvas is portrait 4:5', () => {
  expect(EXPORT_SIZE.height).toBeGreaterThan(EXPORT_SIZE.width);
  expect(EXPORT_SIZE.width / EXPORT_SIZE.height).toBeCloseTo(0.8);
});
