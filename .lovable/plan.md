

## Fix: Neighborhood page default radius

**One-line change** in `src/components/RadiusFilter.tsx`, line 112:

Change `return 'walking'` to `return 'blocks'` for the neighborhood/locality branch.

```
// Before (line 112):
return 'walking';

// After:
return 'blocks';
```

This makes neighborhood-type locations default to Nearby (0.25mi) everywhere the smart default is used. The `/results` page uses a different code path — it passes the location type from the search bar autocomplete suggestion, so GPS searches still default to Walking (line 99: `if (useGPS) return 'walking'`).

**Impact check:**
- `/happy-hour/new-york-ny/west-village` → passes `'neighborhood'` → now gets `'blocks'` (Nearby) ✓
- `/results` with GPS → passes `useGPS=true` → still gets `'walking'` ✓
- `/results` with neighborhood autocomplete suggestion → passes `'neighborhood'` → also gets `'blocks'`. This is actually more correct for neighborhood searches on results too, since it matches your geo-radius philosophy.
- City pages remain `'city'` (25mi) ✓

