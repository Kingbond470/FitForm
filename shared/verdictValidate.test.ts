// Validation guarantees for scan model output (scan-verdict-contract.md).
import { interpret } from './verdictValidate';

const validProfile = {
  usable: true,
  retake_reason: null,
  profile: {
    face_shape: 'oval', body_type: 'mesomorph',
    proportions: { build: 'athletic', torso_leg_ratio: 'balanced', shoulder_waist: 'broad_shoulder' },
    color_season: 'deep_autumn',
    coloring: { skin_undertone: 'warm', contrast: 'high' },
    rules: [
      { type: 'wear', target: 'earth tones', reason: '', category: 'color' },
      { type: 'avoid', target: 'busy patterns', reason: '', category: 'pattern' },
      { type: 'wear', target: 'structured shoulders', reason: '', category: 'fit' },
    ],
    headline: 'Sharp & grounded',
  },
};

test('valid output -> profile', () => {
  const r = interpret(validProfile);
  expect(r.kind).toBe('profile');
});

test('usable=false -> retake with reason', () => {
  const r = interpret({ usable: false, retake_reason: 'no_full_body', profile: null });
  expect(r).toEqual({ kind: 'retake', reason: 'no_full_body' });
});

test('usable=false but no reason -> invalid', () => {
  expect(interpret({ usable: false, retake_reason: null, profile: null }).kind).toBe('invalid');
});

test('fewer than 3 rules -> invalid', () => {
  const p = structuredClone(validProfile);
  p.profile.rules = p.profile.rules.slice(0, 2);
  expect(interpret(p).kind).toBe('invalid');
});

test('missing avoid rule -> invalid (contract requires >=1 wear and >=1 avoid)', () => {
  const p = structuredClone(validProfile);
  p.profile.rules = p.profile.rules.map((r) => ({ ...r, type: 'wear' }));
  expect(interpret(p).kind).toBe('invalid');
});

test('garbage -> invalid', () => {
  expect(interpret(null).kind).toBe('invalid');
  expect(interpret('nope').kind).toBe('invalid');
  expect(interpret({ usable: true, profile: {} }).kind).toBe('invalid');
});
