# Design — FitForm v1

**Owner:** Designer · **Status:** Solutioning → Execution

---

## Principles
- **One hero action on open: "Scan me."** Zero setup. Value before any account/config.
- **Novelty budget spent entirely on verdict screen.** Rest of app = clean, fast, invisible.
- Verdict card is the product's face — it travels (share/screenshot) so it IS the marketing.

## Key flows

### 1. Onboarding → scan
- Open → single "Scan me" CTA.
- Guided capture: face silhouette overlay + body frame overlay → prevents bad photos at source.
- Capture screen trust copy: "Your photo is deleted after analysis."

### 2. Verdict card (the viral artifact) — IMPLEMENTED (R2)
- Rating-card format (FIFA/Madden style — proven to travel).
- Branding + app handle **baked into image bitmap** — cannot crop out trivially.
- Share render == screenshot render (identical).
- 1-tap → native share sheet (TikTok/IG/iMessage).
- Wardrobe teaser on this screen (P0) → pull into the payoff (free in v1, no paywall).
- **Build note:** a *dedicated* export card (`ShareCard`, fixed canvas) is rendered
  off-screen and captured (view-shot) — separate from the responsive on-screen card so
  "looks right on screen" can't diverge from "looks right in the export". Branding sits
  mid-composition (wordmark + handle), not an edge bar, so a crop can't remove it.
- **To validate on device:** font-ready timing before capture; iOS+Android view-shot parity.

### 3. Wardrobe add
- Must FEEL un-chore-like, or we became the incumbent.
- Batch camera capture.
- Auto-tags shown as **editable chips**, ≤1 tap to fix.
- Target: <30s/item end-to-end.

### 4. Paywall
- Transparent free-vs-paid framing BEFORE block.
- Free = verdict (hook). Paid = combos + saved profile (payoff).
- Locked outfits shown blurred → desire → then wall.

## Friction points (lethal, watch)
1. **Bad photo** → specific retake prompt mid-flow ("move to better light", "fit full body in frame"). NEVER generic error, NEVER fabricated verdict. Guided overlay prevents most.
2. **Wardrobe add** → if it feels like cataloging, churn. Batch + auto-tag + 1-tap fix mandatory.
3. **Android low-end cameras** vary wildly → guided-capture + retake MORE critical on Android.

## Safety / tone (with Legal — OPEN)
- Verdicts constructive, styling-focused ONLY.
- Never: appearance-shaming, medicalized content, anything harmful to vulnerable users.
- Needs explicit guardrail list + red-team before launch.

## To validate w/ real users before commit
- Verdict tone reads constructive (not shaming)?
- Auto-tag accuracy — wrong tags kill trust fast.

## Open
- Verdict card visual system / brand.
- Guided-capture overlay spec (face + body).
- Paywall copy + blur treatment.
