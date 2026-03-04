

# Move Neighborhood Filter into UnifiedFilterBar Sidebar

## What Changes

The `NeighborhoodFilter` dropdown moves from above the results column into the `UnifiedFilterBar` sidebar, positioned between the Happening Now/Today buttons and the Categories section. It only renders when neighborhood data is provided (so `/results` is unaffected).

## Layout After Change

```text
┌─────────────────┬──────────────────┬──────────────────┐
│  FILTER SIDEBAR  │  RESULTS COLUMN  │  STICKY MAP      │
│                  │                  │                  │
│  [Happening Now] │  Title: "Happy   │                  │
│  [Happening Today│   Hour in NYC"   │                  │
│                  │                  │                  │
│  Neighborhood ▼  │  ResultsHeader   │                  │
│  [All Neighborh] │  Card Card Card  │                  │
│                  │  ...pagination   │                  │
│  Categories      │                  │                  │
│  Distance        │                  │                  │
│  Days / Time     │                  │                  │
│  Menu Type       │                  │                  │
└─────────────────┴──────────────────┴──────────────────┘
```

## Files to Modify

### 1. `src/components/UnifiedFilterBar.tsx`
- Add optional props: `neighborhoods?: { name: string; count: number }[]`, `selectedNeighborhood?: string | null`, `onNeighborhoodChange?: (value: string | null) => void`
- Import and render `NeighborhoodFilter` between the Happening Now/Today buttons and the Categories section, only when `neighborhoods` is provided
- Include neighborhood in the `hasAnyFilters` check and `clearAllFilters` handler

### 2. `src/pages/LocationLanding.tsx`
- Remove the standalone `NeighborhoodFilter` from the results column header
- Pass `neighborhoods`, `selectedNeighborhood`, and `onNeighborhoodChange` props to `UnifiedFilterBar`

No changes to `NeighborhoodFilter.tsx` itself — it stays as-is, just rendered in a different location.

