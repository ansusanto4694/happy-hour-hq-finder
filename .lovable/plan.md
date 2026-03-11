

## Fix: Update smart default radius for neighborhood and GPS searches

### Changes

| File | Line | Change |
|---|---|---|
| **`src/components/RadiusFilter.tsx`** | ~112 | Change the non-neighborhood-page fallback from `'blocks'` to `'bike'`: `return isNeighborhoodPage ? 'neighborhood' : 'bike';` |

That's it — one word change (`'blocks'` → `'bike'`). GPS/Locate Me already defaults to `'walking'` (1mi), so no change needed there.

### Result
- Neighborhood search on `/results` → defaults to **3mi (bike)** instead of 0.25mi
- Locate Me / GPS → stays at **1mi (walking)** (already correct)
- Neighborhood landing pages → still use DB column filter (unchanged)

