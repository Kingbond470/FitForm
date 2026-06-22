# FitForm

Mobile app: scan face/body/coloring → shareable style verdict → outfits from clothes you own.
Men 18–30, premium. See [PRD-FitForm-v1.md](PRD-FitForm-v1.md) + role docs in [docs/](docs/).

## Stack
- **Client:** React Native + Expo (iOS-first launch, Android fast-follow).
- **Server:** Supabase Edge Functions (Deno) — all vision/ranking server-side.
- **Data:** Supabase Postgres + Storage + Auth (RLS).
- **Vision:** GPT-4o-class (verdict only). Bg-removal/tag: hosted (Photoroom). Paywall: RevenueCat.

## Layout
```
PRD-FitForm-v1.md           product spec
docs/                       role docs (PM/Design/TL/QA/Reviewer) + contracts + spike
shared/                     contract types + deterministic ranker (+ tests) — client+server
src/                        RN client (lib, api, screens)
supabase/
  migrations/0001_init.sql  style_profile / wardrobe_item / outfit + RLS
  functions/scan|garment|outfits   Edge Function stubs (contract-aligned)
App.tsx                     v1 flow wiring
```

## Architecture rules (non-negotiable)
- Verdict = **structured JSON**, app renders card. Model never freestyles.
- Combos = **deterministic ranker** ([shared/ranker.ts](shared/ranker.ts)), NOT per-request LLM. Anti-repeat moat.
- Raw scan photos transient — auto-purge <24h. Profile JSON permanent.
- No catalog-whole-closet wall. No repeat-item suggestions.

## Setup
```bash
cp .env.example .env        # fill keys
npm install
npm run typecheck
npm test                    # ranker determinism + acceptance
supabase db reset           # apply schema
supabase functions serve    # local Edge Functions
npm run ios                 # or: npm run android
```

## Build gate
Wk0 spike ([docs/spikes/wk0-spike.md](docs/spikes/wk0-spike.md)) must pass before Wk1 build:
auto-tag <30s/item + RN native edge parity.

## Status
Scaffold + contracts + ranker (impl) done. Vision/vendor calls = stubs marked `TODO`, pending Wk0 spike + Wk1.
