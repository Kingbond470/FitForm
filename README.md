# FitForm

> **What suits you.** Scan your face, body, and coloring → get a shareable verdict on what actually flatters you → build outfits from the clothes you already own.

A men-first styling app for 18–30s. v1 leads with a **shareable style verdict** (the acquisition engine) and ships a lean **wardrobe-combination** feature (the retention engine). Built React Native + Expo on a Supabase backend, with a free, no-billing vision model.

Source of truth for product decisions: [PRD-FitForm-v1.md](PRD-FitForm-v1.md) · Role docs: [docs/](docs/)

---

## 1. Vision

Most men want to dress better but don't know what suits *their* body type, face shape, and coloring — and even with a full closet, they default to the same few outfits and feel uncertain every morning.

FitForm answers the exact question they're asking — *"what actually suits me?"* — in a verdict worth sharing, then turns that answer into outfits from clothes they already own. No "photograph your entire closet first" wall. No generic, nonsensical pairings.

The long game: own the male self-improvement styling lane the way verdict apps own looksmaxxing — then layer retention (daily outfits, full closet) and platform (social, resale) on top of a base that already spreads on its own.

**Positioning (3 words):** *What suits you.* — it *is* the user's question, implies the personalization without listing features, and is a natural curiosity/share hook.

---

## 2. The problem

- Men default to the same few outfits and feel uncertain daily; they lack the knowledge to combine what they own or know what flatters them.
- Existing wardrobe apps **claim** personalization but deliver generic, often nonsensical pairings.
- They bury value behind a tedious **"catalog your whole closet first"** wall, so people churn before the payoff.

Cost of not solving it: a real, daily, near-universal pain stays unmet, and the styling category keeps producing organizers nobody shares instead of products that spread.

---

## 3. Competitor research

| App | Lane | Signal | Revenue ceiling |
|---|---|---|---|
| **UMAX** | Face/body "rate me" verdict | Viral rating-card format (FIFA/Madden-style) that travels on TikTok/IG | **~$4.2M on Apple alone** |
| **Cal AI** | Scan-based verdict (calories) | Scan → instant verdict → share loop; premium pricing | **~$35M run rate** |
| **Whering** | Digital wardrobe / outfit combos | Best-known brand in the wardrobe lane | **sub-$1M, seed-stage** |

**Recurring criticisms of incumbent wardrobe apps (from reviews):**
- AI recommendations "not super smart" — repetitive, nonsensical pairings.
- The single biggest churn driver: **item-by-item cataloging friction**.
- Same one or two items surfaced in every suggestion.

---

## 4. The insight

The verdict lane prints money; the wardrobe lane has no breakout — **despite the wardrobe problem being the bigger, more frequent, more retentive pain.**

The gap is **distribution and shareability, not demand.**

So v1 uses the proven viral mechanism (a shareable verdict) to solve the cold-start-and-virality problem that has kept every wardrobe app small — then delivers the wardrobe payoff *immediately*, without the cataloging wall that kills the incumbents.

- **Verdict = acquisition engine** (free, shareable, the hook).
- **Wardrobe combinations = retention engine** (the payoff).
- **Why now:** first viral mechanic is proven (UMAX/Cal AI); the wardrobe lane is wide open.

---

## 5. Target user

- **Primary — "Style-anxious Sam" (18–30, male):** wants to look better, follows self-improvement / looksmaxxing-adjacent content, owns decent clothes but lacks the knowledge to combine them. High curiosity, high share propensity, willing to pay for a confident answer.
- **Secondary — the referrer:** friends/partners who see a shared verdict and download to get their own. **The share is the channel.**

---

## 6. How it works (v1 flow)

```
 Scan me  ──►  Guided capture  ──►  Verdict card        ──►  Wardrobe        ──►  Outfits
 (hero)       (face + body,         (shareable, branded,     (add 5–15 items,     (combos built
              silhouette overlay)   1-tap share + teaser)    auto-tagged)         for your look)
```

1. **Scan** — guided face + body capture → a style profile: face shape, body type/proportions, color season/coloring, and 3–5 concrete *wear this / avoid this* rules.
2. **Verdict card** — a polished, branded, screenshot-ready rating card. One-tap share to TikTok/IG/iMessage, branding baked into the image.
3. **Wardrobe** — add a handful of your own garments by photo; automatic background removal + auto-tagging; ≤1-tap correction. No whole-closet wall.
4. **Outfits** — combinations built from *your* items, filtered/ranked by your profile — never random, never the same two items every time.

v1 is **free** (no paywall). Monetization is deferred behind a flag — see decisions.

---

## 7. Technical solutioning (TL)

### Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  CLIENT — React Native + Expo (iOS-first launch, Android FF)   │
│  guided capture · verdict card + share · wardrobe · outfits    │
└───────────────┬──────────────────────────────────────────────┘
                │ HTTPS (no client-side model/vendor calls)
┌───────────────▼──────────────────────────────────────────────┐
│  SERVER — Supabase Edge Functions (Deno)                       │
│  POST /scan     quality gate → vision → JSON → persist         │
│  POST /garment  bg-removal → auto-tag → store → persist        │
│  POST /outfits  deterministic ranker over tagged items         │
└──────┬───────────────┬───────────────────┬───────────────────┘
       │               │                   │
┌──────▼──────┐ ┌──────▼───────┐ ┌─────────▼──────────────────┐
│ Vision      │ │ Photoroom    │ │ Postgres + Storage + Auth  │
│ (Gemini/    │ │ bg-removal   │ │ (RLS; cutouts only — raw   │
│  OpenAI)    │ │              │ │  scans never persisted)    │
└─────────────┘ └──────────────┘ └────────────────────────────┘
```

### Key engineering decisions (and why)

- **Verdict = structured JSON, not prose.** Styling rules (proportion / color theory / fit-for-body) + safety guardrails are encoded in the system prompt; the model returns a strict schema. The app renders the card from JSON → consistent, defensible, cacheable, cheap to re-render. The model never freestyles.
- **Combinations = a deterministic ranker, not an LLM.** Items are pre-tagged; the profile gives allow/avoid rules. A pure rule-based scorer (color harmony · formality coherence · profile-rule match · category completeness · pattern-clash · anti-repeat) ranks outfits. Fast, cheap, **testable**, and free of the repeat-item drift that plagues incumbents. **This is the anti-incumbent moat.**
- **Provider-agnostic vision.** One `visionJSON()` seam (`VISION_PROVIDER`) — default **Google Gemini 2.0 Flash (free tier, no billing)**, OpenAI gpt-4o retained behind the flag. Swapping models is config, not a rewrite.
- **Raw biometric photos are never persisted.** Selfie/body images are processed in-memory and discarded; only the derived profile JSON is stored. Strongest privacy posture, simplest legal surface. (Tradeoff: no server-side retry/debug from raw — re-scan instead.)
- **Buy, don't build, the vendor-y parts.** Hosted background removal (Photoroom) instead of an in-house segmentation model.
- **Server-side everything sensitive.** No client-direct model/vendor calls — cost control, key safety, prompt control.
- **Extensible records now.** `style_profile` and `wardrobe_item` are first-class so the v2 closet engine and v3 social layer need no data migration.

### Data model

| Table | Purpose | Notes |
|---|---|---|
| `style_profile` | Derived verdict (permanent asset) | face/body/proportions/color_season/coloring/rules (jsonb); **no raw photo** |
| `wardrobe_item` | Tagged garment, feeds the ranker | bg-removed cutout URL + category/color/formality/pattern |
| `outfit` | Generated combo (persisted for share + anti-repeat) | item_ids[], occasion, score, profile_version |
| `analytics_event` | Funnel events (R6) | event/props/user_id; insert-only RLS; queried via service role |

All tables are RLS-scoped to the signed-in user.

### Auth + RLS note (learned in build)

The project uses **ES256 (asymmetric) JWT signing**. The client must use the
**publishable key** (`sb_publishable_…`), *not* the legacy anon JWT — under ES256,
PostgREST only resolves `auth.uid()` in RLS with the publishable key. Inserts also
send `user_id` explicitly (the DB `default auth.uid()` resolves null in default-context).
Edge Functions authenticate via `getUser()` and write with the service role.

---

## 8. Design principles

1. **One hero action on open: "Scan me."** Zero setup. Value before any account or configuration.
2. **Spend the novelty budget entirely on the verdict screen.** The verdict card is the product's face — it travels (share/screenshot), so it *is* the marketing. Rating-card format proven to spread; branding baked into the export so it can't be trivially cropped out.
3. **Friction is the enemy in the wardrobe.** Batch add, optimistic per-item cards, auto-tags as editable chips with ≤1-tap fixes. If it feels like cataloging, we became the incumbent.
4. **Guide capture; never break or fabricate.** Silhouette overlays prevent bad photos at the source. A bad photo gets a *specific* retake prompt ("step back so your full body fits"), never a generic error and never a made-up verdict.
5. **Constructive only.** Verdicts are styling-focused — never appearance-shaming, never medicalized, every "avoid" framed as a styling choice, not a flaw.
6. **Trust signals up front.** "Your photo is deleted after analysis" on the capture screen.

### Anti-patterns we explicitly refuse (the moat)

- ❌ The same one or two items in every suggestion.
- ❌ The "catalog your whole closet first" wall.
- ❌ Generic, profile-blind pairings.

---

## 9. Decisions log

1. **Verdict-led wedge** — the scan/share is the hero; wardrobe is the payoff. (+ wardrobe teaser on the verdict screen.)
2. **RN cross-platform codebase, staged launch** — iOS-first → Android fast-follow.
3. **Raw photo never persisted** — in-memory only; profile JSON permanent.
4. **Free launch** — no paywall in v1; everything open behind a reversible `FREE_LAUNCH` flag (`shared/entitlements.ts`). Monetization re-enables by flipping one flag + wiring RevenueCat. Premium later is *additive* (v2), never a claw-back of free v1 features.
5. **Free vision provider** — Gemini 2.0 Flash (no billing) behind `VISION_PROVIDER`; OpenAI dormant. $0 vision for validation.

Goals (v1): activation (install→verdict) 60% · share rate 20% · verdict trust 70% · wardrobe activation 40% · D30 retention ≥30%. Revenue metrics deferred with the paywall.

---

## 10. Stack

- **Client:** React Native + Expo (iOS-first launch, Android fast-follow).
- **Server:** Supabase Edge Functions (Deno) — all vision/ranking server-side.
- **Data:** Supabase Postgres + Storage + Auth (RLS), anonymous sign-in.
- **Vision:** provider-agnostic (`VISION_PROVIDER`) — default Gemini 2.0 Flash (free), OpenAI optional.
- **Background removal:** Photoroom.
- **Payments:** RevenueCat (dormant — v1 is free).

## Repo layout

```
PRD-FitForm-v1.md           product spec (source of truth)
docs/                       role docs (PM/Design/TL/QA/Reviewer) + contracts + spike
shared/                     contract types + ranker + vision/share/analytics helpers (+ tests)
src/                        RN client — lib (supabase, auth, analytics), api, components, screens
supabase/
  migrations/               schema + storage bucket + analytics
  functions/scan|garment|outfits   Edge Functions (+ _shared vision/verdict/garment layers)
App.tsx                     v1 flow wiring
```

---

## 11. Live environment

Supabase project **fitform** (`snuajzyiktqnzqsfdjvr`, ap-south-1) — provisioned via CLI.

| Layer | State |
|---|---|
| Auth (anon), DB, RLS, storage bucket | live + verified |
| `/outfits` deterministic ranker | live + verified |
| `/scan` quality gate + pipeline | live (gate verified) |
| `/garment` Photoroom bg-removal | live + verified |
| Vision model step (verdict + tagging) | code live; **needs a free `GEMINI_API_KEY`** |
| R2 shareable verdict card export | built (off-screen capture → share sheet); device-verify pending |
| R6 funnel analytics | built + verified live |
| Client screens + guided capture + anon auth | built, not device-verified |

**29/29** unit tests pass; `tsc` clean. Edge Functions typechecked at deploy.
Migrations applied: `0001_init` · `0002_storage` · `0003_analytics`.

## Setup

Supabase prerequisites: enable **Anonymous sign-ins** (Auth → Providers), apply migrations
(creates the `wardrobe` bucket + analytics), set function secrets (`GEMINI_API_KEY`,
`PHOTOROOM_API_KEY`). The client `.env` must use the **publishable key** (`sb_publishable_…`),
not the legacy anon JWT (see Auth + RLS note). Get a free Gemini key (no billing) at
https://aistudio.google.com/apikey.

```bash
cp .env.example .env        # fill keys
npm install
npm run typecheck
npm test                    # ranker + validators
supabase db push            # apply schema
supabase functions deploy scan garment outfits
npm run ios                 # or: npm run android
```

---

## 12. Roadmap

- **v1 (this repo)** — the wedge + lean payoff. Verdict scan, shareable card, lean wardrobe add, personalized combinations, analytics. *Goal: validate virality + verdict trust + wardrobe payoff.*
- **v2** — the retention engine. Full closet management at scale, daily auto-outfit, weather/occasion/packing, gap analysis + shopping. *Goal: turn one-time sharers into daily-active retained users.*
- **v3** — the platform. Social/community, resale marketplace, AR try-on, women's + broader demographics, creator tooling. *Goal: defensibility and TAM expansion.*

Each phase de-risks the next: v1 proves cheap acquisition + trusted recommendations; v2 only matters once people return; v3 (network, marketplace) only pays off on a retained base.
