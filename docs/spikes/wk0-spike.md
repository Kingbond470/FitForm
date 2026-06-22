# Wk0 Spike — De-risk Before Build

**Owner:** TL · **Duration:** time-boxed, 1 week · **Gate:** result decides R3 approach + launch scope

Two unknowns that can break the build plan. Answer both before committing build weeks.

---

## Spike A — Auto-tag <30s/item bar (R3)

**Hypothesis:** hosted bg-removal + auto-tag hits <30s/item end-to-end with ≤1-tap correction.

**Risk if wrong:** wardrobe add feels like incumbent cataloging → churn. Core retention assumption dies.

### Test
1. Pipeline: garment photo → bg-removal API (Photoroom + remove.bg, compare) → auto-tag (vision model vs lightweight classifier).
2. Sample set: 30 real men's garments (tops/bottoms/outer/shoes), varied backgrounds + lighting.
3. Measure per item:
   - End-to-end latency (capture → tagged) — target <30s.
   - Tag accuracy: category / subtype / color / formality (% correct).
   - Corrections needed per item — target ≤1 tap.
   - Cost per item (API spend).

### Pass criteria
- ≥80% items <30s end-to-end.
- Category + color accuracy ≥85% (these drive ranker).
- Median corrections ≤1.

### Fallback if fail
- Drop weakest auto-field (subtype/pattern) → more chips, fewer auto-tags.
- Or single-vendor bg-removal + cheaper classifier.
- Re-scope <30s bar if vendor latency is the bottleneck.

### Output
- Vendor pick (bg-removal + tagger).
- Confirmed/adjusted R3 latency bar.
- Cost-per-item input to unit economics.

---

## Spike B — RN native edge parity (cross-platform)

**Hypothesis:** native edges (camera, bg-removal SDK, IAP, share-sheet) work cross-platform with ~+2wk Android effort, not +40%.

**Risk if wrong:** staged-launch plan slips; Android fast-follow balloons.

### Test (abstract from day-1, verify both platforms)
1. **Guided-capture camera** — face + body overlay on iOS + Android. Low-end Android device included.
2. **Bg-removal** — API path (server-side, platform-agnostic) confirmed > client SDK; verify no native dependency.
3. **IAP** — RevenueCat sandbox purchase + restore + trial, both stores configured.
4. **Share-sheet** — branded image export to native share, both platforms render identical.

### Pass criteria
- All 4 edges functional on iOS + low-end Android.
- Android delta estimable in days, not project-wide %.

### Output
- Abstraction layer for camera/IAP/share (built Wk0, reused all build).
- Confirmed staged-launch timeline (iOS-first → Android FF window).
- Android device test matrix for QA.

---

## Spike exit
- Both spikes report by end Wk0.
- Auto-tag PASS → proceed R3 as specced. FAIL → apply fallback, update [TL.md](../TL.md) + [QA.md](../QA.md).
- Update unit-economics model with measured cost/item + cost/scan.
- Reviewer gate: spike result review before Wk1 build start.
