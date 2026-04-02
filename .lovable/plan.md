

## Phase 6: Performance Fixes for High-Density Pages

### What this solves

NYC and other dense city pages load 600+ map markers simultaneously, risking memory crashes on mobile. Broken merchant images can cause layout glitches. And if Mapbox itself crashes (WebGL failure), the whole page goes down.

---

### Fix 1: Viewport-based marker filtering

Only render markers visible on the current map viewport (plus a 20% buffer). Cuts ~600 mounted React components down to ~30-80.

**File: `src/components/ResultsMap.tsx`**

Add a `useMemo` that computes viewport bounds from the current `viewState` and filters the restaurants array to only those within bounds. Apply this filtered list in both the mobile and desktop marker render loops. The bounds calculation uses simple lat/lng math based on zoom level to estimate the visible area, with a 20% padding so markers don't pop in/out right at the edge.

---

### Fix 2: Map error boundary

Wrap the `<ResultsMap>` in a dedicated error boundary inside `LazyResultsMap.tsx`. If Mapbox crashes (WebGL context loss, OOM), users see "Map couldn't load" with a retry button instead of a full-page "Something went wrong."

**File: `src/components/LazyResultsMap.tsx`**

Add a `MapErrorBoundary` class component that catches errors, renders a friendly fallback with a "Try Again" button that resets the error state, and logs the error for debugging.

---

### Fix 3: Image error fallbacks

Add `onError` handlers to the two `<img>` tags (mobile and desktop) in `SearchResultCard.tsx`. When a `logo_url` fails to load, hide the broken image and show the `<Store>` icon placeholder instead.

**File: `src/components/SearchResultCard.tsx`**

Add a `const [imgError, setImgError] = useState(false)` state. Change the conditional from `restaurant.logo_url ?` to `restaurant.logo_url && !imgError ?` and add `onError={() => setImgError(true)}` to both `<img>` tags.

---

### Fix 4: Cache buster bump

**File: `src/App.tsx`**

Change `buster: 'v7'` → `'v8'` to force all users to get the performance-optimized code.

---

### Files changed

| File | Change |
|------|--------|
| `src/components/ResultsMap.tsx` | Add viewport-bounds `useMemo` filter for markers |
| `src/components/LazyResultsMap.tsx` | Add `MapErrorBoundary` wrapper |
| `src/components/SearchResultCard.tsx` | Add `imgError` state + `onError` fallback on logo images |
| `src/App.tsx` | Bump cache buster `v7` → `v8` |

