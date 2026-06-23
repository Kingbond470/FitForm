# Reviewer — FitForm v1

**Owner:** Reviewer (Head of Product + cross-functional panel) · **Status:** Decisions reviewed

---

## Panel review outcomes

### Decision 1 — Verdict-led wedge → HELD
- HoP: verdict = proven money lane. Risk: free-verdict users churn before wardrobe.
- **Mitigation added (now P0): blurred wardrobe teaser on verdict screen** → pull to paywall same session.
- Design + TL: approved (verdict-first also lets combo engine lag).

### Decision 2 — RN cross-platform → AMENDED
- HoP push-back: v1 goal = validate virality + verdict trust, not reach. Why pay 30–40% QA tax pre-PMF?
- TL: RN gives UI both-platform free; tax is native edges (camera, bg-removal SDK, IAP×2, share-sheet, Android fragmentation) — front-loadable, ~+2wk not +40% if abstracted Wk0.
- Design: Android low-end cameras → retake flow more critical.
- **Outcome: RN cross-platform CODEBASE, staged launch — iOS-first → Android fast-follow 2–4wk.** Keeps cross-platform call + validation speed.

### Decision 3 — Delete raw post-process → HELD + refined
- TL: zero-retention kills model improvement + bad-verdict debugging.
- **Refinement: transient raw (auto-purge <24h post-process), region-gated, consented. Profile JSON permanent.**
- Design: "photo deleted after analysis" = trust copy on capture screen.

**UPDATE (impl, a546a26):** /scan went further than the transient-bucket refinement — raw images are processed **in-memory and never persisted at all**. Stronger privacy + simpler legal surface. Tradeoff: no server-side retry/debug or model-improvement from raw (re-scan instead). **NEEDS Reviewer/Legal sign-off** to confirm never-store is acceptable (it strictly reduces risk vs the approved transient plan, so expected to pass).

## Free-launch decision (SPM + TL)
- v1 ships **fully free** — paywall deferred. Validate loop before monetizing.
- Reversible: all gating via `shared/entitlements.ts` `canUse()`, open while
  `FREE_LAUNCH=true`. `/outfits` returns 402 when flipped. RevenueCat dormant.
- Premium later = additive (v2), never claw back v1 free features.
- **R5 acceptance (paywall) DEFERRED** — re-instate when monetization turns on.

## Progress review (built since panel)
- **R2 shareable card export — DONE.** Branding baked mid-composition (non-croppable);
  off-screen export card separate from on-screen. Acceptance met in code; device-verify pending.
- **R6 funnel analytics — DONE + verified.** Own-backend, instrumented end-to-end; every
  leading metric (activation/share/wardrobe-activation) computable. Attribution SDK deferred.
- **Infra regression caught + fixed.** Legacy anon key broke RLS `auth.uid()` under ES256
  signing → client writes 403. Switched to publishable key. **Gate added below.**

## Standing review gates (before ship)
1. **Verdict safety red-team** — no shaming/medical/harmful output. Blocking ship. *(still open)*
2. **Biometric legal sign-off** — consent, retention, deletion, regional. Blocking launch.
3. **Verdict JSON contract review** — schema strict, validated, ranker reads JSON not prose. ✓ (validators tested)
4. **Auto-tag spike result** — confirms <30s/item bar or triggers fallback. *(Wk0 unrun)*
5. **Analytics completeness** — every success metric computable from events. ✓ (R6 done)
6. **Unit economics** — vision cost/scan sustainable. Now **$0** on Gemini free tier for validation.
7. **Auth-key correctness** — client uses publishable key so RLS works on device. Verify on device.

## Open items needing PM sign-off
- Positioning string final ("What suits you").
- Confirm panel amendments (staged launch + blurred teaser) — assumed yes.

## Anti-patterns to enforce (from competitive research)
- NO repeat-item suggestions (incumbent failure).
- NO catalog-whole-closet-first wall (churn driver).
- NO generic/nonsensical pairings — ranker must respect profile.
