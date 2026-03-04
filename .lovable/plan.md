
Issue identified from logs and code, step by step:

1) Runtime logs show:
- `ReferenceError: Cannot access 'allMerchants' before initialization`
- at `LocationLanding.tsx` around line `367`

2) In `src/pages/LocationLanding.tsx`:
- `neighborhoodCenters` is computed with `useMemo` around lines `357-373`
- That memo references `allMerchants` (both inside the callback and in `[allMerchants]` dependencies)

3) `allMerchants` is declared later (around line `430`) via:
- `const { data: allMerchants } = useMerchants(...)`

4) Because `allMerchants` is a `const`, this is a temporal dead zone error:
- `neighborhoodCenters` tries to read `allMerchants` before declaration
- React crashes and `ErrorBoundary` shows “Something went wrong”

Why this happened:
- The previous fix moved `neighborhoodCenters` earlier to solve the `neighborhoodCenters` ordering bug, but it ended up before `allMerchants`, creating a new initialization-order bug.

Implementation plan to fix:

1) Reorder declarations in `LocationLanding.tsx` so `allMerchants` is declared before `neighborhoodCenters`.
   - Keep hooks unconditional.
   - No logic changes, only order.

2) Keep `neighborhoodCenters` before first usage:
   - It must stay above `const neighborhoodCenter = ...`
   - But below `const { data: allMerchants } = useMerchants(...)`

3) Recommended stable order in the data section:
```text
radiusMiles
allMerchants query
neighborhoodCenters memo
neighborhoodCenter/useGeoNeighborhood derived values
rawMerchants query
sorted merchants memo
neighborhoodOptions memo
```

4) Validate after reorder:
- Select neighborhood on `/happy-hour/new-york-ny`
- Confirm no error boundary
- Confirm radius auto-sets to Nearby
- Expand radius (walking/bike) and results update
- Clear filters and confirm reset behavior

This is a pure initialization-order fix; no backend or edge-function changes are needed.
