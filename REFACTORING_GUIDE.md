# Analytics Storage Optimization - Refactoring Guide

## Summary
Migration completed to remove unnecessary/redundant fields from analytics tracking to reduce storage costs by ~60-70%.

## Changes Made

### Database Migration
1. Added `viewport_width` and `viewport_height` to `user_sessions` table  
2. Removed from `user_events` table:
   - `viewport_width`
   - `viewport_height`
   - `page_url` (redundant with `page_path`)
   - `referrer_url` (already in `user_sessions`)
   - `element_id`
   - `element_text`
   - `element_class`

### Code Changes Required
Need to remove `pageUrl`, `pagePath`, `elementText`, `elementId`, `elementClass` from all tracking calls.

**Pattern to remove:**
```typescript
// BEFORE
await track({
  eventType: 'click',
  eventCategory: 'search',
  eventAction: 'some_action',
  pageUrl: window.location.href,  // REMOVE
  pagePath: window.location.pathname,  // REMOVE (automatically captured)
  elementText: someText,  // REMOVE (move to metadata if needed)
});

// AFTER  
await track({
  eventType: 'click',
  eventCategory: 'search',
  eventAction: 'some_action',
  metadata: { contextData: someText }, // Optional: keep important context in metadata
});
```

### Remaining Files to Fix
- src/components/SearchBar.tsx (21 instances)
- src/components/UnifiedFilterBar.tsx (6 instances)
- src/pages/Results.tsx (2 instances)

Use search & replace to remove lines matching:
- `pageUrl: window.location.href,`
- `pagePath: window.location.pathname,`
- `elementText:` (move valuable data to metadata)

## Expected Storage Savings
- Removed 7 columns from high-volume `user_events` table
- Viewport data now stored once per session instead of per event
- Estimated 60-70% reduction in analytics storage costs
