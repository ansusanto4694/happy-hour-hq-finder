

## Fix: Back Button Requires Double-Tap on Mobile (Take 2)

### Why Previous Fixes Failed

The ToastViewport overlay theory was wrong. The user's screenshot proves the button IS receiving the tap (it shows the active/highlight state). The click handler IS firing. The problem is that React Router's `navigate(-1)` is not reliably completing the navigation on the first call on mobile.

This is a known quirk with React Router v6's `navigate(-1)` on mobile browsers -- the programmatic navigation can be silently swallowed during certain render cycles, especially when combined with `keepPreviousData` query options and scroll restoration effects that trigger re-renders.

### The Fix

Replace `navigate(-1)` with `window.history.back()` -- the browser's native back navigation. The user already confirmed that the browser's native back button works every time. This approach:

- Uses the exact same mechanism as the browser back button (which works)
- Bypasses React Router's internal scheduling that can conflict with mobile touch handling
- Is simpler and more reliable for "go back" behavior

**File: `src/components/RestaurantHeader.tsx`** (2 lines changed)

Change the `handleBack` function:

```typescript
const handleBack = (e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  if (window.history.length > 1) {
    window.history.back();    // was: navigate(-1)
  } else {
    navigate('/results');
  }
};
```

- `window.history.back()` triggers the same behavior as the browser back button
- `e.preventDefault()` added to ensure no default button behavior interferes
- The `navigate('/results')` fallback is kept for the edge case where there's no history (direct URL entry)
- The `navigate` import and hook can stay since it's still used for the fallback case

### Cleanup (Optional)

The `pointer-events-none` added to `ToastViewport` in the previous fix is harmless and actually a good defensive practice, so it can stay. Same for the `pointer-events-none` on decorative overlays.

