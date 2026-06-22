# Contract — `/outfits` Deterministic Ranker

**Owner:** TL · **Reviewers:** PM (anti-repeat), QA (distinctness) · **Status:** Draft v1

Personalized combos (R4). **Deterministic rule-based scorer — NOT an LLM call.** Reads pre-tagged items + profile JSON. Fast, cheap, testable, no repeat-item drift. This is the anti-incumbent moat.

---

## Endpoint
```
POST /outfits
Body: { occasion?: "casual"|"work"|"date" }   // occasion = P1
Auth: required. Entitlement check `canUse('outfits')` — OPEN during FREE_LAUNCH (v1), returns 402 when monetization flips on.
```

## Flow
```
1. LOAD user's wardrobe_item[] + style_profile
2. GATE: need >=5 items spanning >=2 categories -> else { status:"insufficient" }
3. GENERATE candidate outfits (valid category combos)
   - min viable: top + bottom + shoe (+ optional outer/accessory)
4. SCORE each candidate (see formula)
5. ANTI-REPEAT penalty on items used in recently returned combos
6. RETURN top-N distinct (>=3), non-repetitive
```

## Scoring formula
```
score = w1*color_harmony
      + w2*formality_coherence
      + w3*profile_rule_match
      + w4*category_completeness
      - w5*pattern_clash
      - w6*repeat_penalty
```

| Term | Source | Logic |
|---|---|---|
| color_harmony | item color_hex + profile.color_season/coloring | items within seasonal palette + contrast match profile.coloring.contrast |
| formality_coherence | item.formality (1-5) | low variance across outfit items = high score |
| profile_rule_match | profile.rules[] | +reward 'wear' targets, -penalize 'avoid' targets (fit/color/proportion/pattern) |
| category_completeness | item.category | complete silhouette (top+bottom+shoe) required; outer/accessory bonus |
| pattern_clash | item.pattern | >1 bold pattern in outfit = penalty |
| repeat_penalty | recent outfit history | item appeared in last K returned combos = penalty |

Weights `w1..w6` tunable; start hand-set, refine w/ P1 feedback loop (R8).

## Anti-repeat (PRD hard requirement)
- Track item usage across returned combos per session.
- Penalty scales with recency/frequency.
- **Negative acceptance:** same 1–2 items MUST NOT appear in every suggestion (explicit incumbent failure).

## Response schema
```json
{
  "status": "ok",
  "outfits": [
    {
      "id": "uuid",
      "item_ids": ["uuid","uuid","uuid"],
      "occasion": "casual",
      "score": 0.87,
      "profile_version": "string"
    }
  ]
}
```
```json
{ "status": "insufficient", "need": { "min_items": 5, "min_categories": 2 }, "have": { "items": 3, "categories": 1 } }
```

## Occasion filter (P1, R7)
- `occasion` shifts formality target window (casual→low, work/date→mid-high) + reweights.
- v1 ships ranker occasion-agnostic; P1 adds the filter.

## Acceptance (QA)
- ≥5 items / ≥2 categories → ≥3 distinct combos respecting profile rules.
- Negative: no same-1–2-items-every-suggestion.
- <5 items or single category → correct `insufficient` gating, no broken output.
- Determinism: same input + history → reproducible ranking (testable).

## Why not LLM
- Per-request LLM = cost, latency, non-determinism, repeat-item drift.
- Items already structured by `/garment`; profile already structured by `/scan`.
- Math is cheap + auditable → moat is *reliability* incumbents lack.
