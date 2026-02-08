

## Fix: Independent Scrolling for Desktop Filters

**The problem:** When you expand the filter sections (Categories, Happy Hour Time, Days, Menu Type, Distance) on desktop, the filter panel grows taller than the screen. Since the panel doesn't have its own scroll bar, scrolling your mouse wheel anywhere on the page just moves the merchant results list up and down -- you can't scroll through the filter options themselves.

**The fix:** Give the filter panel its own scroll area so it scrolls independently from the results list. This means:

- You can scroll up and down inside the filters without affecting the results list
- You can scroll through the results list without affecting the filters
- The map stays pinned in place as it does today

**What the experience will feel like after the fix:**
1. You open `/results` on desktop and see filters on the left, results in the middle, map on the right
2. You expand several filter sections (e.g., Categories + Days + Menu Type)
3. If the expanded filters are taller than your screen, a subtle scrollbar appears inside the filter panel
4. Scrolling your mouse while hovering over the filters only scrolls the filters
5. Scrolling while hovering over the results list only scrolls the results
6. Everything else stays exactly the same

**What stays the same:**
- All filter functionality (selecting categories, days, time, etc.)
- The "Clear All" button behavior
- The sticky positioning of the filter panel
- The map and results layout
- Mobile layout is completely unaffected

---

### Technical Details

**File: `src/pages/Results.tsx`** (Desktop layout section, around line 506-507)

Current code:
```
<div className="w-80 flex-shrink-0">
  <div className="space-y-4 sticky top-32 z-40">
```

Updated code:
```
<div className="w-80 flex-shrink-0">
  <div className="sticky top-32 z-40 max-h-[calc(100vh-9rem)] overflow-y-auto">
```

This single change:
- `max-h-[calc(100vh-9rem)]` caps the filter panel's height to the viewport minus the header space (the `top-32` offset = 8rem, plus 1rem breathing room)
- `overflow-y-auto` adds a scrollbar only when the filters are taller than the available space
- Removes `space-y-4` from this wrapper since `UnifiedFilterBar` already handles its own internal spacing

That's it -- one line change in one file.

