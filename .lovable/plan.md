

## Fix: Widen Distance Threshold + Bulk Update Affected Merchants

### Problem
The `getConfidence()` function in the `fetch-google-places` edge function uses a 2km cutoff — anything beyond that is tagged `no_match`. In dense urban areas, Mapbox and Google often geocode the same address to coordinates >2km apart, causing 261 merchants to be incorrectly suppressed (no ratings, no map links).

### Two-Part Fix

**Part 1 — Widen thresholds in the edge function** (prevents future false negatives)

Update `getConfidence()` in `supabase/functions/fetch-google-places/index.ts`:

| Distance | Current | New |
|----------|---------|-----|
| ≤ 100m | high | high |
| ≤ 500m | medium | medium |
| ≤ 2,000m | low | low |
| ≤ 5,000m | **no_match** | **low** |
| > 5,000m | no_match | no_match |

This widens the safety net from 2km to 5km. In practice, geocoding discrepancies rarely exceed 3-4km for valid addresses, so this catches the false negatives while still rejecting truly wrong matches.

**Part 2 — Bulk update existing records** (fixes the 261 already-affected merchants)

Run an UPDATE via the insert tool to set all current `no_match` records that have a valid `google_place_id` to `low` confidence. This immediately restores ratings and map links for all affected merchants.

```sql
UPDATE merchant_google_ratings
SET match_confidence = 'low', updated_at = now()
WHERE match_confidence = 'no_match'
  AND google_place_id IS NOT NULL;
```

### Files Changed
| File | Change |
|------|--------|
| `supabase/functions/fetch-google-places/index.ts` | Widen `getConfidence()` threshold from 2km to 5km |
| Database (via insert tool) | Bulk update `match_confidence` from `no_match` → `low` for records with valid `google_place_id` |

### Result
- All 261 merchants immediately get their Google ratings and map links restored
- Future merchants won't hit this false-negative issue unless coordinates differ by >5km

