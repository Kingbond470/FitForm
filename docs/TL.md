# TL — FitForm v1 Tech Solutioning

**Owner:** Tech Lead · **Status:** Architecture set, execution starting

---

## Stack
- **Client:** React Native + Expo. iOS-first launch, Android fast-follow (shared codebase).
- **Server:** Supabase Edge Functions (Deno) / Node API. All vision behind server — no client-direct model calls (cost, key safety, prompt control).
- **Data:** Supabase Postgres + Storage + Auth (RLS).
- **Vision verdict:** provider-agnostic (`_shared/vision.ts`, `VISION_PROVIDER`).
  Default **Google Gemini 2.0 Flash** (free tier, no billing); OpenAI gpt-4o
  retained behind the flag. Swap = config, not rewrite. Chosen because OpenAI
  account had no quota and free-launch wants $0 vision for validation.
- **Bg-removal + tag:** hosted (Photoroom / remove.bg) — buy, not build.
- **IAP/paywall:** RevenueCat (handles iOS + Android stores).

## Architecture
```
CLIENT (RN+Expo) --HTTPS--> SERVER (Edge Fns)
  guided capture                POST /scan     -> vision LLM -> JSON
  card render + share           POST /garment  -> bg-removal + auto-tag
  wardrobe + combos             POST /outfits  -> deterministic ranker
  paywall (RevenueCat)          POST /feedback -> (P1) ranking signal
                                |
                          Postgres + Storage(cutouts only) + Auth
```

## Core rule
- **Verdict = structured JSON, NOT prose.** Styling rules (proportion/color season/fit) + safety guardrails encoded in system prompt. App renders card from JSON. Defensible, cacheable, cheap re-render.
- **Combos = deterministic rule-based ranker, NOT per-request LLM.** Items pre-tagged; profile gives allow/avoid. Fast, cheap, no repeat-item drift, testable.

## Data model (extensible — v2/v3 no migration)
- `style_profile` — face_shape, body_type, proportions(jsonb), color_season, rules(jsonb), model_version. Permanent. Raw photo NOT stored here.
- `wardrobe_item` — image_url(bg-removed), category, subtype, color_primary, color_hex, formality(1-5), pattern, tags_source. Permanent.
- `outfit` — item_ids[], occasion, score, profile_version. Persisted for share/feedback.

## Pipelines
**/scan:** quality gate (cheap CV: face/body detected, blur/light) FIRST → fail = retake code, no LLM call. Pass → vision LLM w/ strict JSON schema (structured output) → validate schema, retry once → persist profile. **Raw images processed in-memory, NEVER persisted** (strongest privacy; supersedes earlier transient-bucket plan). Tradeoff: no server-side retry/debug of bad verdicts — re-scan instead.

**/garment:** hosted bg-removal → cutout. Auto-tag category/color/formality. Store cutout (permanent) + tags. Return editable chips. <30s/item bar.

**/outfits:** pull tagged items + profile rules → rule scorer (color-season match + formality coherence + wear/avoid + category completeness) → anti-repeat penalty on recent items → top-N distinct (≥3).

## Build sequence
| Wk | Work |
|---|---|
| 0 | SPIKE: auto-tag <30s bar + RN native edge parity |
| 1-3 | /scan verdict pipeline + JSON contract + safety guardrails (gates all) |
| 2-3 | Verdict card render + share-sheet (parallel) |
| 3-4 | Quality gate / retake flow (P0 edge) |
| 4-5 | /garment add + wardrobe UI |
| 5-6 | /outfits ranker + combo browse + blurred teaser |
| 6 | ~~Paywall~~ DEFERRED (free launch). Entitlement seam open via shared/entitlements.ts |
| 1-6 | Analytics funnel (continuous) |
| 7 | iOS launch · Android fast-follow |

## Risks
| Risk | Mitigation |
|---|---|
| Verdict JSON inconsistent | structured-output mode + schema validate + retry; ranker reads JSON not prose |
| Auto-tag misses <30s | Wk0 spike; fallback fewer auto-fields + more chips |
| Multimodal cost/scan vs $30/yr | meter in spike; cache profile, never re-scan free |
| Biometric legal | raw never stored + consent + region gate before launch |
| RN native edge parity | abstract camera/IAP/share from Wk0; iOS-first launch |

## Cross-platform ripple (from RN decision)
- IAP via RevenueCat (both stores).
- Camera/guided-capture + bg-removal SDK: verify Android parity in Wk0 spike.
- Android low-end device perf test (vision upload + render).

## Implemented since solutioning

**R2 share export.** Dedicated off-screen `ShareCard` (fixed canvas, branding baked
INTO the composition, not a croppable edge bar) → `react-native-view-shot` `captureRef`
→ `expo-sharing`. Kept separate from the on-screen card so export never diverges from
display. Pure helpers (`shared/share.ts`) unit-tested.

**R6 analytics.** Own-backend, no third-party SDK. `analytics_event` (event/props/user_id),
insert-only RLS, queried via service role. `shared/analytics.ts` = event vocab + ordered
FUNNEL. `src/lib/analytics.ts` `track()` = fire-and-forget, off the critical path.
Instrumented across App/Scan/Verdict/Wardrobe/Outfits. Attribution SDK deferred (app_open
= install proxy).

## Infra learning — auth keys + RLS (important)
Project uses **ES256 (asymmetric) JWT signing**. Consequences, learned by debugging
live 403s:
- **Client must use the publishable key** (`sb_publishable_…`), NOT the legacy anon JWT.
  With the legacy key PostgREST does not resolve `auth.uid()` in RLS → every client-direct
  write fails. Masked at first because Edge Functions use service-role (bypass RLS).
- **Send `user_id` explicitly** on inserts; the DB `default auth.uid()` resolves null in
  default-context (works inside RLS predicates, not as a column default).
- Edge Functions: `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` auto-inject; auth via
  `getUser(token)`.

## Migrations applied (live)
`0001_init` (style_profile/wardrobe_item/outfit + RLS) · `0002_storage` (wardrobe bucket) ·
`0003_analytics` (analytics_event + RLS).
