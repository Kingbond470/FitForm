// Validation guarantees for garment auto-tag output (garment-contract.md).
import { interpretTags } from './garmentValidate';

const ok = {
  usable: true,
  reject_reason: null,
  tags: { category: 'top', subtype: 'oxford shirt', color_primary: 'navy', color_hex: '#1b2a4a', formality: 3, pattern: 'solid' },
};

test('valid -> tags', () => {
  const r = interpretTags(ok);
  expect(r.kind).toBe('tags');
  if (r.kind === 'tags') expect(r.tags.category).toBe('top');
});

test('usable=false -> reject with reason', () => {
  expect(interpretTags({ usable: false, reject_reason: 'not_clothing', tags: null }))
    .toEqual({ kind: 'reject', reason: 'not_clothing' });
});

test('usable=false but no reason -> invalid', () => {
  expect(interpretTags({ usable: false, reject_reason: null, tags: null }).kind).toBe('invalid');
});

test('bad category -> invalid', () => {
  expect(interpretTags({ ...ok, tags: { ...ok.tags, category: 'hat' } }).kind).toBe('invalid');
});

test('formality out of range -> invalid', () => {
  expect(interpretTags({ ...ok, tags: { ...ok.tags, formality: 7 } }).kind).toBe('invalid');
  expect(interpretTags({ ...ok, tags: { ...ok.tags, formality: 2.5 } }).kind).toBe('invalid');
});

test('bad hex -> invalid', () => {
  expect(interpretTags({ ...ok, tags: { ...ok.tags, color_hex: 'navy' } }).kind).toBe('invalid');
  expect(interpretTags({ ...ok, tags: { ...ok.tags, color_hex: '#12345' } }).kind).toBe('invalid');
});

test('missing optional strings default to empty', () => {
  const r = interpretTags({ ...ok, tags: { ...ok.tags, subtype: undefined, color_primary: undefined } });
  expect(r.kind).toBe('tags');
  if (r.kind === 'tags') { expect(r.tags.subtype).toBe(''); expect(r.tags.color_primary).toBe(''); }
});

test('garbage -> invalid', () => {
  expect(interpretTags(null).kind).toBe('invalid');
  expect(interpretTags({ usable: true, tags: {} }).kind).toBe('invalid');
});
