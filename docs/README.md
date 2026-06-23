# FitForm v1 — Role Docs Index

Source of truth: [PRD-FitForm-v1.md](../PRD-FitForm-v1.md)

| Role | Doc | Covers |
|---|---|---|
| PM | [PM.md](PM.md) | Positioning, goals, metrics, locked decisions, scope, open questions |
| Design | [DESIGN.md](DESIGN.md) | Flows, verdict card, friction points, tone/safety, validation needs |
| TL | [TL.md](TL.md) | Stack, architecture, data model, pipelines, build sequence, risks |
| QA | [QA.md](QA.md) | Acceptance criteria, edge cases, cross-platform matrix, safety tests |
| Reviewer | [REVIEWER.md](REVIEWER.md) | Panel decisions, review gates, anti-patterns |

## Execution artifacts
| Artifact | Doc | Status |
|---|---|---|
| Wk0 spike (auto-tag + RN parity) | [spikes/wk0-spike.md](spikes/wk0-spike.md) | Spec ready (not yet run) |
| `/scan` verdict contract | [contracts/scan-verdict-contract.md](contracts/scan-verdict-contract.md) | Implemented |
| `/garment` bg+tag contract | [contracts/garment-contract.md](contracts/garment-contract.md) | Implemented (Photoroom) |
| `/outfits` ranker contract | [contracts/outfits-ranker-contract.md](contracts/outfits-ranker-contract.md) | Implemented |
| R2 shareable card export | (in [DESIGN.md](DESIGN.md) + code) | Implemented |
| R6 funnel analytics | (in [TL.md](TL.md) + code) | Implemented + verified |

## Locked decisions (quick ref)
1. **Verdict-led wedge** (+ wardrobe teaser P0)
2. **RN cross-platform codebase, staged launch** (iOS-first → Android FF)
3. **Raw photo never persisted** (in-memory only; supersedes transient-bucket), permanent profile JSON
4. **FREE LAUNCH** — no paywall in v1; everything open. Reversible via `shared/entitlements.ts` (`FREE_LAUNCH` flag). Monetization deferred.
5. **Free vision provider** — Gemini 2.0 Flash (no billing) behind `VISION_PROVIDER`; OpenAI dormant. $0 vision for validation.

## Build status (snapshot)
Backend **live** on Supabase (`fitform` / `snuajzyiktqnzqsfdjvr`, ap-south-1).

| Layer | State |
|---|---|
| Auth (anon), DB, RLS, storage bucket | live + verified |
| `/outfits` deterministic ranker | live + verified |
| `/scan` quality gate + pipeline | live + verified (gate) |
| `/garment` Photoroom bg-removal | live + verified (direct 200) |
| Vision model step (scan verdict + garment tag) | code live; **needs free `GEMINI_API_KEY`** to run |
| **R2 shareable verdict card export** | built (ShareCard + view-shot capture → share sheet); device-verify pending |
| **R6 funnel analytics** | built + verified live (`analytics_event`, `track()`, instrumented) |
| Client (RN+Expo): scan/verdict/wardrobe/outfits + guided capture + anon auth | built, **not device-verified** |
| Account upgrade, image downscale, full tag-edit chips | **not built** (P1) |

**29/29** unit tests (pure logic) pass; tsc clean. Edge Functions typechecked at deploy (no local Deno).

### Key infra learning (TL/QA)
Client must use the **publishable key** (`sb_publishable_…`), not the legacy anon JWT:
under the project's ES256 JWT signing, PostgREST only resolves `auth.uid()` in RLS
with the publishable key. The legacy key 403'd every client-direct write (masked
because Edge Functions use service-role). Plus: send `user_id` explicitly on inserts —
the DB `default auth.uid()` resolves null in default-context.

## Current phase
Backend deployed; R2 (share) + R6 (analytics) built. **One blocker to full vision:**
free `GEMINI_API_KEY`. Next when resumed: set the key → live end-to-end scan; then
device verification, image downscale, full tag-edit chips, P1 (occasion filter,
feedback loop). Safety red-team still required before ship. Wk0 spike still unrun.
