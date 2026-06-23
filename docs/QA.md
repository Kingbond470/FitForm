# QA — FitForm v1

**Owner:** QA · **Status:** Test planning

---

## Verification snapshot (paused)
- **Unit-tested + passing (26/26):** ranker (insufficient-gate, ≥3 distinct, determinism, anti-repeat), verdict-output validation, garment-tag validation, entitlements (free-launch open), share helpers (export name/caption/canvas).
- **R2 share export built:** dedicated off-screen `ShareCard` (branding baked in) → `react-native-view-shot` capture → `expo-sharing`. Device-verify the captured image on iOS + Android (view-shot parity).
- **Verified live (CLI smoke):** anon auth, `/outfits` insufficient, `/scan` cheap-gate, Photoroom bg-removal (direct 200 + RGBA cutout).
- **Blocked until `GEMINI_API_KEY` set:** `/scan` verdict, `/garment` auto-tag (model step).
- **Not yet verified:** client screens on device, end-to-end happy path, analytics events (R6 unbuilt), safety red-team, cross-platform matrix.

## Acceptance criteria (from PRD requirements)

### R1 — Scan → style profile
- [ ] Usable face+body photo → verdict in <~15s with profile + ≥3 specific do/don't rules.
- [ ] Low-quality/partial photo → specific retake prompt (NOT generic error, NOT fabricated result).
- [ ] Negative: never appearance-shaming or medicalized content. Constructive/styling only.

### R2 — Shareable verdict card
- [ ] Completed verdict → tap Share → single branded image to native share sheet.
- [ ] Card renders identically shared vs screenshotted; branding not trivially croppable.

### R3 — Lean wardrobe add
- [ ] Garment photo → bg removed + type/color auto-tagged within few seconds.
- [ ] Edit a tag in ≤1 tap.
- [ ] Adding 5 items materially less effort than incumbents; <~30s/item end-to-end.

### R4 — Personalized outfit combinations
- [ ] ≥5 items spanning ≥2 categories → ≥3 distinct non-repetitive combos respecting profile rules.
- [ ] Negative: engine does NOT surface same 1–2 items in every suggestion (anti-incumbent).

### R5 — Paywall (DEFERRED — free launch)
- v1 ships free; no paywall. Re-instate these when monetization flips on:
- [ ] (deferred) Completed verdict → attempt outfits → clear paywall before block.
- [ ] (deferred) Purchase, restore, trial states function on iOS (+ Android).
- [ ] FREE-LAUNCH check: `/outfits` accessible without any entitlement; no paywall surfaces anywhere.

### R6 — Analytics
- [ ] Each funnel step emits tracked event: install → scan start → scan complete → share → add item → first outfit → paywall view → purchase.
- [ ] Events carry properties needed to compute success metrics.

## Edge / negative cases
- Partial body, face-only, blurry, low-light, multiple people, occluded.
- Verdict JSON malformed → schema reject + retry, never render garbage.
- Garment: busy background, multiple garments in frame, non-clothing.
- Combos with <5 items or single category → correct gating, no broken output.
- Paywall: purchase interrupted, restore after reinstall, trial expiry.
- Offline / slow network during scan upload.

## Cross-platform matrix
- iOS: launch target. Full pass.
- Android (fast-follow): low-end camera quality, device fragmentation, perf on vision upload+render, share-sheet variants, IAP store config.

## Safety test (with Design/Legal)
- Red-team verdict for shaming/medical/harmful output across diverse inputs.
- Biometric: confirm raw images are never written to storage/logs (in-memory only); inspect /scan path + DB + bucket after a scan.

## Metrics instrumentation check
- Verify every Success Metric is computable from emitted events before launch.
