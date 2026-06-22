# PM — FitForm v1

**Owner:** SPM · **Source:** PRD-FitForm-v1.md · **Status:** Solutioning → Execution

---

## Positioning
- One-liner: **"What suits you."** (recommended, decision pending sign-off)
- Mobile app: scan face/body/coloring → shareable verdict (acquisition) → outfits from clothes user owns (retention).
- Beachhead: men 18–30, premium pricing (~$30/yr).

## Thesis
- Verdict lane prints money (UMAX ~$4.2M Apple, Cal AI ~$35M run rate); wardrobe lane has no breakout (Whering sub-$1M).
- Gap = **distribution/shareability, not demand**. v1 uses verdict virality to crack wardrobe cold-start.

## Goals (success metrics)
**FREE LAUNCH (current):** v1 ships free — validate the loop before monetizing.
Revenue metrics deferred; activation/virality/retention elevated.

| Metric | Target | Stretch | Status |
|---|---|---|---|
| Activation (install → verdict) | 60% | 75% | **primary** |
| Share rate (verdict → external share) | 20% | 35% | **primary** |
| Verdict trust ("sounds like me") | 70% | — | **primary** |
| Wardrobe activation (≥5 items + ≥1 outfit / 7d) | 40% | — | **primary** |
| D30 retention (free users) | ≥30% | — | primary |
| k-factor | →0.5, path >1 | — | primary |
| Paywall conversion (download → paid) | 4% | 6% | **DEFERRED** (no paywall in v1) |
| CAC payback | — | — | DEFERRED |

## Locked decisions
1. **Verdict-led wedge** — "Scan me" = hero, novelty budget on verdict card. Wardrobe = paid payoff.
   - + New P0 req (panel): **blurred wardrobe teaser on verdict screen** → drives paywall same session.
2. **Platform** — RN cross-platform codebase; **staged launch: iOS-first → Android fast-follow 2–4wk** (panel amendment to original "day-1 both").
3. **Biometric** — raw photo processed in-memory, NEVER persisted (impl superseded transient-bucket plan → stronger privacy). Permanent profile JSON only. Trust copy on capture screen. *Tradeoff:* no server retry/debug of bad verdicts — re-scan. Needs Reviewer/Legal bless.

## Free-launch decision (SPM + TL)
- v1 ships **fully free** — no paywall. Reason: validate virality + verdict trust
  + wardrobe payoff with zero friction before monetizing.
- **Reversible by design:** everything gated through `shared/entitlements.ts`
  `canUse()`, currently open via `FREE_LAUNCH=true`. Re-enable monetization =
  flip one flag + wire RevenueCat status. No rework, infra stays dormant.
- Premium later (v2) is **additive** (closet/daily-outfit) — never claw back v1
  free features (avoids backlash).
- RevenueCat dep kept installed but dormant. Analytics funnel unchanged.

## Scope
**In (P0):** verdict scan, shareable card, lean wardrobe add (5–15), personalized combos, analytics funnel. (Paywall **deferred** — free launch.)
**P1 fast-follow:** occasion filter, good/bad feedback loop, style-this-item, referral.
**Out (hold line):** full closet mgmt, daily auto-outfit, social/resale, women's, AR try-on. → v2/v3.

## Open questions
| # | Owner | Question | Status |
|---|---|---|---|
| 1 | Stakeholder | Confirm verdict-led wedge | RESOLVED — verdict-led |
| 2 | Eng | Platform v1 | RESOLVED — RN, staged launch |
| 3 | Design/Legal | Verdict tone/safety guardrails | OPEN — blocking SHIP not start |
| 4 | Legal | Biometric consent/retention/deletion/regional | OPEN — blocking launch |
| 5 | Data | Verdict accuracy metric method | OPEN — non-blocking |
| 6 | Eng/Design | Auto-tag <30s/item bar | OPEN — Wk0 spike |

## Pending sign-off
- Positioning string final.
- Panel amendments: staged launch + blurred teaser (assumed yes).
