
## Full-Width Mobile Result Cards

### Goal
Make mobile merchant result cards span the full width of the screen, similar to how Google Maps displays restaurant listings -- flat, borderless cards separated by simple dividers instead of bordered card containers with side margins.

### Changes

**1. `src/components/MobileListDrawer.tsx`**
- Remove horizontal padding (`px-4`) from the scrollable content container so cards can reach screen edges

**2. `src/components/SearchResultCard.tsx`**
- For mobile cards only: remove the `<Card>` border, shadow, and rounded corners
- Add a bottom border divider between cards instead (like Google Maps style)
- Keep internal content padding so text doesn't touch screen edges

**3. `src/components/SearchResults.tsx`**
- Reduce vertical spacing between mobile cards from `space-y-3` to `space-y-0` since the divider approach replaces gaps

### Visual Result
```text
Before:                          After:
|  +-----------------+  |       |                     |
|  | Card Content    |  |       | Card Content        |
|  +-----------------+  |       |---------------------|
|                       |       | Card Content        |
|  +-----------------+  |       |---------------------|
|  | Card Content    |  |       | Card Content        |
|  +-----------------+  |       |---------------------|
```

### Technical Details

- `MobileListDrawer.tsx`: Change `className="px-4 pb-20 ..."` to `className="pb-20 ..."`
- `SearchResultCard.tsx` mobile Card: Replace border/shadow/rounded styling with `border-0 shadow-none rounded-none border-b` and adjust padding
- `SearchResults.tsx`: Conditionally use `space-y-0` when `isMobile` is true, keep `space-y-3` for desktop
- No changes to desktop layout -- all modifications are gated behind the existing `isMobile` prop
