

## Fix: Neighborhood dropdown missing on mobile neighborhood pages

### Problem
On line 658 of `LocationLanding.tsx`, the mobile `MobileListDrawer` receives `neighborhoods={!neighborhood ? neighborhoodOptions : undefined}`. This means when you're already on a neighborhood page (e.g., `/happy-hour/new-york-ny/greenwich-village`), the dropdown is hidden because `neighborhood` is truthy.

Meanwhile, the desktop layout (line 716) passes `neighborhoods={neighborhoodOptions}` unconditionally, so it always shows.

### Fix
One line change in `src/pages/LocationLanding.tsx` line 658:

Change:
```tsx
neighborhoods={!neighborhood ? neighborhoodOptions : undefined}
```
To:
```tsx
neighborhoods={neighborhoodOptions}
```

This matches the desktop behavior exactly — the neighborhood dropdown will appear in the mobile filter drawer on both city pages and neighborhood pages, allowing users to switch neighborhoods without navigating back.

