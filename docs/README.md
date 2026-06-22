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
| Wk0 spike (auto-tag + RN parity) | [spikes/wk0-spike.md](spikes/wk0-spike.md) | Spec ready |
| `/scan` verdict contract | [contracts/scan-verdict-contract.md](contracts/scan-verdict-contract.md) | Draft v1 |
| `/garment` bg+tag contract | [contracts/garment-contract.md](contracts/garment-contract.md) | Draft v1 (vendor pending spike) |
| `/outfits` ranker contract | [contracts/outfits-ranker-contract.md](contracts/outfits-ranker-contract.md) | Draft v1 |

## Locked decisions (quick ref)
1. **Verdict-led wedge** (+ wardrobe teaser P0)
2. **RN cross-platform codebase, staged launch** (iOS-first → Android FF)
3. **Raw photo never persisted** (in-memory only; supersedes transient-bucket), permanent profile JSON
4. **FREE LAUNCH** — no paywall in v1; everything open. Reversible via `shared/entitlements.ts` (`FREE_LAUNCH` flag). Monetization deferred.

## Current phase
Execution. Wk0 spike spec + all 3 API contracts drafted. Next: run Wk0 spike, then scaffold repo (RN+Expo client, Supabase schema, Edge Function stubs).
