# Contract — `/scan` Verdict Pipeline

**Owner:** TL · **Reviewers:** Design (tone), Legal (safety), PM (rules) · **Status:** Draft v1

The wedge's core. Output of this gates the verdict card (R2) AND the combo ranker (R4). Model returns **structured JSON only** — never prose, never freestyle.

---

## Endpoint
```
POST /scan
Content-Type: multipart/form-data
Body: face_image, body_image
Auth: required (Supabase JWT)
```

## Flow
```
1. QUALITY GATE (cheap CV, no LLM)
   - face detected in face_image?
   - full body in frame in body_image?
   - blur / lighting acceptable?
   FAIL -> return { status:"retake", reason_code, message } (no model call)

2. VISION LLM CALL (structured output mode)
   - system prompt = styling rules + safety guardrails + schema
   - input = both images
   - temperature low (consistency)

3. VALIDATE JSON vs schema
   - malformed -> retry once
   - still malformed -> return { status:"error", retryable:true }

4. PERSIST profile JSON (style_profile table)
   - raw images processed in-memory only — NEVER persisted (supersedes transient-bucket plan; strongest privacy posture)

5. RETURN profile JSON -> client renders card
```

## Response schema (success)
```json
{
  "status": "ok",
  "model_version": "gpt-4o-2026-xx",
  "profile": {
    "face_shape": "oval | round | square | oblong | heart | diamond | triangle",
    "body_type": "ectomorph | mesomorph | endomorph | mixed",
    "proportions": {
      "build": "slim | average | broad | athletic",
      "torso_leg_ratio": "balanced | long_torso | long_legs",
      "shoulder_waist": "balanced | broad_shoulder | narrow_shoulder"
    },
    "color_season": "light_spring | true_spring | deep_autumn | ... ",
    "coloring": {
      "skin_undertone": "warm | cool | neutral",
      "contrast": "low | medium | high"
    },
    "rules": [
      {
        "type": "wear | avoid",
        "target": "string  // e.g. 'structured shoulders', 'high-contrast pairings'",
        "reason": "string  // styling rationale, constructive",
        "category": "fit | color | proportion | pattern"
      }
    ],
    "headline": "string  // short shareable verdict line for card"
  }
}
```
**Constraints:** `rules` MUST contain ≥3 entries, ≥1 `wear` and ≥1 `avoid`. Each rule maps to a ranker-usable signal (fit/color/proportion/pattern).

## Response schema (retake / error)
```json
{ "status": "retake", "reason_code": "no_face | no_full_body | too_blurry | too_dark | multiple_people", "message": "string  // specific, actionable" }
{ "status": "error", "retryable": true }
```

## System prompt skeleton (encoded rules — model does NOT freestyle)
```
You are a men's style analyst. Analyze the provided face and body photos.
Apply established styling theory:
 - PROPORTION: dress to balance shoulder/waist/torso/leg ratios.
 - COLOR THEORY: map skin undertone + contrast to a seasonal palette;
   recommend colors that harmonize, flag colors that clash.
 - FIT-FOR-BODY: fit guidance specific to detected build.
Output ONLY valid JSON matching the provided schema. No prose outside JSON.

SAFETY (hard constraints):
 - Constructive, styling-focused ONLY.
 - NEVER appearance-shaming, NEVER comment on attractiveness/weight as judgment.
 - NEVER medical/health claims or body-image framing.
 - Frame every 'avoid' as a styling choice, not a flaw.
 - If photo insufficient to judge confidently, do NOT fabricate — the quality
   gate handles retakes; return best-effort only on usable input.
```

## Ranker handoff (why JSON shape matters)
- `rules[].category` + `target` → ranker filters/weights.
- `color_season` + `coloring` → color-match scoring of wardrobe items.
- `proportions` → fit/silhouette weighting.
- Ranker reads structured fields, never parses prose → deterministic, testable.

## Acceptance (QA)
- Usable input → verdict <~15s, ≥3 rules (≥1 wear, ≥1 avoid).
- Bad input → specific retake reason_code, no LLM call, no fabricated profile.
- Negative: no shaming/medical content across red-team inputs.
- Malformed model output → schema reject + single retry, never render garbage.

## Open
- Final color-season taxonomy (12-season vs simplified).
- `headline` tone — Design owns voice.
- Confidence threshold tuning for quality gate (Wk0).
