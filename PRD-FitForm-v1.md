# PRD — "FitForm" (working name) · v1

**Status:** Draft for review · **Owner:** PM · **Last updated:** 22 Jun 2026
**One-liner / positioning (3 words):** *What suits you* (see positioning note at end)

---

## TL;DR

A mobile app that scans a man's face, body, and coloring, tells him what actually suits him in a shareable verdict, then builds outfit combinations from the clothes he already owns. v1 leads with the shareable verdict (the acquisition engine) and includes a lean version of the wardrobe-combination feature (the retention engine). Full closet management, daily suggestions, social, and resale are explicitly v2/v3.

**Why now:** The face/body "what suits me" lane prints money (UMAX: ~$4.2M on Apple alone; Cal AI: ~$35M run rate), while the digital-wardrobe lane has no breakout (Whering, the best-known brand, is seed-stage with sub-$1M revenue). v1 uses the first to crack the cold-start-and-virality problem that has kept the second small.

---

## Problem Statement

Most men want to dress better but don't know what suits *their* body type, face shape, and coloring — and even with a full closet, they default to the same few outfits and feel uncertain every morning. Existing wardrobe apps claim personalization but deliver generic, often nonsensical pairings, and they bury value behind a tedious "photograph your entire closet first" wall, so people churn before the payoff. The cost of not solving it: a real, daily, near-universal pain stays unmet, and the styling category keeps producing organizers nobody shares instead of products that spread.

**Evidence (from competitive research):** Incumbent AI recommendations are widely criticized as "not super smart" with repetitive, nonsensical pairings; the single biggest churn driver reviewers cite is item-by-item cataloging friction; and the category's commercial ceiling (Whering, sub-$1M) versus the verdict-app ceiling (UMAX/Cal AI, multi-million) shows the gap is *distribution and shareability*, not demand.

---

## Goals

1. **Crack cold-start virality.** Achieve a self-sustaining share loop: ≥20% of users who complete a verdict share it externally within their first session.
2. **Deliver a verdict users trust.** ≥70% of users rate their style verdict as "accurate / sounds like me" (in-app thumbs or 1-tap survey).
3. **Prove the wardrobe payoff fast.** ≥40% of activated users add ≥5 of their own items and generate ≥1 personalized outfit within 7 days.
4. **Monetize like the comps, not like the incumbents.** Trial/hard-paywall conversion ≥4% of downloads to paid, mirroring premium-only verdict apps rather than thin freemium organizers.
5. **Establish the men-first beachhead.** Reach a defensible install base in the male 18–30 self-improvement segment before any expansion.

*(User goal: "finally know what suits me and use what I own." Business goal: a viral, premium-priced consumer app with a retention layer.)*

---

## Non-Goals (explicitly out of scope for v1)

1. **Full closet management** (large-wardrobe cataloging, search, calendar, packing lists, wear tracking). *Why:* This is the incumbents' friction wall; it's the retention layer, not the wedge. → **v2.**
2. **Daily auto-outfit + weather/occasion engine.** *Why:* High value but presumes a digitized closet we don't yet have; sequence after cataloging is solved. → **v2.**
3. **Social feed, community, follows, resale marketplace.** *Why:* Adds backend and moderation complexity with no v1 payoff; the *share* is external (TikTok/IG), not an in-app network. → **v3.**
4. **Women's styling / full gender expansion.** *Why:* Focus beats breadth at launch; men 18–30 is the proven, underserved beachhead. → **v3.**
5. **AR/virtual try-on and shopping/affiliate commerce.** *Why:* Heavy to build, distracts from the core "use what you own" promise, and risks biasing recommendations toward selling. → **v2/v3.**

---

## Target Users

- **Primary persona — "Style-anxious Sam" (18–30, male):** wants to look better, follows self-improvement / looksmaxxing-adjacent content, owns decent clothes but lacks the knowledge to combine them or know what flatters him. High curiosity, high share propensity, willing to pay for a confident answer.
- **Secondary (passive, v1) — "Gift / nudge" referrer:** friends/partners who see a shared verdict and download to get their own. The share *is* the channel.

---

## User Stories (prioritized)

**Acquisition & verdict (the hook)**
1. As a style-anxious man, I want to scan my face and body and instantly get a clear verdict on what suits me, so I stop guessing every morning. *(P0)*
2. As a new user, I want a single obvious action ("Scan me") the moment I open the app, so I get value before any setup. *(P0)*
3. As a user proud of my result, I want a clean, screenshot-worthy verdict card I can share to TikTok/IG/iMessage in one tap, so I can show friends. *(P0)*

**Wardrobe combinations (the payoff)**
4. As a user, I want to add a few of my own clothes quickly (a handful, not my whole closet), so I get personalized outfits without a chore. *(P0)*
5. As a user, I want outfit combinations built from my own items that respect what suits my body/coloring, so the suggestions feel right, not random. *(P0)*
6. As a user, I want to tell the app the occasion (casual / work / date), so the combination fits the moment. *(P1)*

**Trust, edge & monetization**
7. As a user, I want to mark a suggestion "good / bad," so recommendations improve and don't restyle the same two items. *(P1)*
8. As a user with a bad-quality or partial photo, I want clear guidance to retake it rather than a broken result, so I trust the verdict. *(P0 — edge)*
9. As a user, I want to understand what's free vs paid before I'm blocked, so the paywall feels fair. *(P0)*

---

## Requirements

### Must-Have (P0) — v1 cannot ship without these

**R1. Onboarding scan → style profile**
- User captures a guided selfie (face) and a full-body photo; app derives a style profile: face shape, body type/proportions, color season/coloring, and 3–5 concrete "wear this / avoid this" rules.
- *Tech (Tech Lead hat):* multimodal vision model (GPT-4o-class) behind a server endpoint; do **not** let the raw model freestyle — encode styling rules (proportion, color theory, fit-for-body-type) into the system prompt so output is consistent and defensible. React Native + Expo client; Supabase/Firebase for auth + storage.
- *Design (Designer hat):* one hero action on open ("Scan me"); novelty budget goes entirely into the verdict screen.
- **Acceptance:**
  - Given a usable face + body photo, when the user finishes the scan, then a verdict appears in < ~15s with profile + at least 3 specific do/don't rules.
  - Given a low-quality/partial photo, when analysis can't run confidently, then the user gets a specific retake prompt (not a generic error, not a fabricated result).
  - Negative: the app never returns appearance-shaming or medicalized content; verdicts are constructive and styling-focused only.

**R2. Shareable verdict card (the viral artifact)**
- A polished, branded, screenshot-/export-ready card summarizing the verdict (rating-card format proven to travel — think the FIFA/Madden card UMAX borrowed).
- One-tap share to system share sheet (TikTok, IG, iMessage) with app attribution/handle baked into the image.
- **Acceptance:**
  - Given a completed verdict, when the user taps Share, then a single image (with branding) is exported to the native share sheet.
  - The card renders identically whether shared or screenshotted (branding cannot be cropped out trivially).

**R3. Lean wardrobe add**
- User adds a small set of their own garments (target: 5–15 items) via photo, with automatic background removal + auto-categorization/tagging; manual correction allowed but not required.
- **Acceptance:**
  - Given a single garment photo, when uploaded, then background is removed and type/color are auto-tagged within a few seconds; user can edit a tag in ≤1 tap.
  - Adding 5 items takes materially less effort than incumbents' per-item manual tagging (target: under ~30s/item end-to-end).

**R4. Personalized outfit combinations**
- From the user's added items, generate outfit combinations that are filtered/ranked by the style profile (body/coloring/fit), not random pairings.
- **Acceptance:**
  - Given ≥5 added items spanning ≥2 categories, when the user requests outfits, then ≥3 distinct, non-repetitive combinations are returned that respect the profile rules.
  - Negative: the engine does not surface the same one or two items in every suggestion (explicit anti-pattern from incumbent reviews).

**R5. Paywall / monetization**
- Free: the verdict (the hook). Paid: wardrobe combinations + saved profile (the payoff). Premium-only pricing in the comp range (~$30/yr / low monthly), paywall tested via Superwall-style infra.
- **Acceptance:**
  - Given a user who completed the free verdict, when they attempt to generate outfits, then a clear paywall is shown with transparent free-vs-paid framing before blocking.
  - Purchase, restore, and trial states all function on iOS (and Android if in launch scope — see Open Questions).

**R6. Analytics & attribution**
- Instrument the full funnel: install → scan start → scan complete → share → add item → first outfit → paywall view → purchase. Attribution SDK for paid/influencer channels.
- **Acceptance:** every funnel step above emits a tracked event with the properties needed to compute the Success Metrics below.

### Nice-to-Have (P1) — fast follows

- **R7. Occasion filter** (casual/work/date) on outfit generation.
- **R8. Feedback loop** ("good/bad" on suggestions) feeding ranking.
- **R9. "Style this item"** — pick one owned item, get combinations around it.
- **R10. Referral incentive** layered on top of organic sharing.

### Future Considerations (P2) — design v1 so these stay cheap later

- Full closet at scale (calendar, weather, packing, wear tracking) — **v2**.
- Daily auto-outfit engine — **v2**.
- Gap analysis + shopping/affiliate — **v2**.
- Social/community, resale — **v3**.
- Women's + broader demographics — **v3**.
- AR try-on / digital twin — **v3**.
- *Architectural insurance:* store the style profile and item catalog as first-class, extensible records now so the v2 closet engine and v3 social layer don't require a data migration.

---

## Success Metrics

**Leading (days–weeks)**
- **Activation:** % of installs that complete a verdict. *Target 60% / stretch 75%* (measured 1 week post-install cohort).
- **Share rate:** % of verdict-completers who share externally. *Target 20% / stretch 35%* (the viral coefficient input).
- **Verdict trust:** % rating verdict accurate. *Target 70%.*
- **Wardrobe activation:** % of activated users who add ≥5 items + generate ≥1 outfit within 7 days. *Target 40%.*
- **Paywall conversion:** downloads → paid. *Target 4% / stretch 6%.*

**Lagging (weeks–months)**
- **Retention:** D30 retention of paid users. *Target ≥30%* (Cal AI–class benchmark).
- **Virality (k-factor):** invites/shares × conversion per user. *Target trending toward ≥0.5*, with a path to >1.
- **Revenue:** MRR trajectory; CAC payback inside one subscription term on paid channels.
- **Recommendation quality drift:** repeat-item rate in suggestions trending down over releases (our anti-incumbent moat).

*Evaluation cadence: review leading metrics weekly for the first month; lagging at 1 and 3 months post-launch.*

---

## Open Questions

- **[Stakeholder] Scope of the wedge:** Confirm we lead with the shareable verdict (my recommendation) vs. leading with the wardrobe engine (your original framing). This determines v1's hero flow. **Blocking.**
- **[Eng] Platform for v1:** iOS-only first (faster, premium audience) or RN cross-platform day one? **Blocking** for estimation.
- **[Design/Legal] Verdict tone & safety:** exact guardrails so face/body analysis stays constructive and never shades into appearance-shaming, medical claims, or anything that could harm vulnerable users. **Blocking.**
- **[Legal] Biometric/face data handling:** consent, retention, deletion, and regional rules (e.g., processing selfies/body photos). **Blocking before launch.**
- **[Data] Verdict accuracy baseline:** how we measure "accuracy" for something partly subjective — define the trust metric method. **Non-blocking, resolve during build.**
- **[Eng/Design] Cataloging friction target:** validate the auto-tag pipeline can hit the "<30s/item, ≤1 tap to fix" bar. Time-boxed spike. **Non-blocking.**

---

## Timeline & Phasing

**v1 (this spec) — the wedge + lean payoff.** Verdict scan, shareable card, lean wardrobe add, personalized combinations, paywall, analytics. Men 18–30, premium pricing. *Goal: validate virality + verdict trust + wardrobe payoff.*

**v2 (later, separate spec) — the retention engine.** Full closet management at scale, daily auto-outfit suggestions, weather/occasion/packing, gap analysis + shopping. *Goal: turn one-time verdict-sharers into daily-active retained subscribers.*

**v3 (later, separate spec) — the platform.** Social/community, resale marketplace, AR try-on/digital twin, women's and broader demographic expansion, creator/influencer tooling. *Goal: defensibility and TAM expansion.*

*Sequencing rationale:* each phase de-risks the next — v1 proves we can acquire cheaply and that recommendations are trusted; v2 only makes sense once v1 shows people will return; v3 (network, marketplace) only pays off on top of a retained base.

---

## Positioning note (3-word) — decision pending in chat

Recommended: **"What suits you."** Rationale against the viral filters — it *is* the exact question the user is asking (instant comprehension), it implies the body/face/color personalization without listing features, and it's a natural curiosity/share hook ("the app that tells you what actually suits you"). Alternatives under consideration: *"Dress for you," "Your style, solved," "Wear what wins."*
