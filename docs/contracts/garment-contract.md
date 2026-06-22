# Contract — `/garment` Bg-Removal + Auto-Tag

**Owner:** TL · **Reviewers:** Design (chip UX), QA (accuracy) · **Status:** Implemented. Bg-removal = **Photoroom** (live, sandbox key). Auto-tag = provider-agnostic vision (`VISION_PROVIDER`, default Gemini). `<30s/item` bar still to validate (Wk0 Spike A unrun).

Lean wardrobe add (R3). Photo in → bg-removed cutout + structured tags out. Feeds the ranker. Must hit <30s/item, ≤1-tap correction.

---

## Endpoint
```
POST /garment
Content-Type: multipart/form-data
Body: garment_image
Auth: required
```

## Flow
```
1. UPLOAD garment_image
2. BG-REMOVAL (hosted: Photoroom/remove.bg — Wk0 picks)
   -> cutout PNG (transparent)
3. AUTO-TAG (vision model or classifier)
   -> category, subtype, color_primary, color_hex, formality, pattern
4. STORE cutout (permanent) + tags (wardrobe_item table)
5. RETURN item + tags as editable chips
```

## Response schema
```json
{
  "status": "ok",
  "item": {
    "id": "uuid",
    "image_url": "https://.../cutout.png",
    "category": "top | bottom | outer | shoe | accessory",
    "subtype": "string  // e.g. 'oxford shirt', 'chino', 'derby'",
    "color_primary": "string  // named, e.g. 'navy'",
    "color_hex": "#RRGGBB",
    "formality": 3,            // 1 (casual) .. 5 (formal)
    "pattern": "solid | striped | checked | printed | textured",
    "tags_source": "auto"
  }
}
```

## Error / edge schema
```json
{ "status": "error", "reason_code": "no_garment_detected | multiple_garments | not_clothing", "message": "string" }
```

## Tag editing (Design — ≤1 tap)
- Each tag = editable chip in UI.
- Tap chip → picker (category/subtype/color/formality/pattern) → 1-tap fix.
- On edit: `tags_source` → `"user-edited"`.
- User-edited tags weighted as ground truth (never overwritten by re-tag).

## Field → ranker mapping
| Field | Ranker use |
|---|---|
| category | category completeness (top+bottom+shoe min) |
| color_primary / color_hex | color-season harmony scoring |
| formality | formality coherence within outfit |
| pattern | pattern-clash avoidance |
| subtype | display + occasion fit (P1) |

## Acceptance (QA)
- Single garment photo → bg removed + type/color tagged within few seconds.
- Edit any tag in ≤1 tap.
- 5 items add materially faster than incumbents; <~30s/item end-to-end.
- Edge: busy bg / multiple garments / non-clothing → correct reason_code, no garbage tags.

## Open (Wk0-dependent)
- Vendor pick (bg-removal + tagger) — Spike A.
- Which auto-fields survive if accuracy/latency fails — fallback to more chips.
- Color naming taxonomy (must align with color_season harmony logic).
