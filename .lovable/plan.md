
# Fix: Preserve Search Context When Navigating Back from Restaurant Profile

## Problem Summary
When users navigate from the Results page to a Restaurant Profile and then tap the back button in the header, they lose their search context (location, filters, scroll position). The app shows "ALL locations across the US" instead of their previous search results.

## Root Cause
The back button in the mobile RestaurantHeader uses `navigate('/results')` which navigates to the Results page **without any URL parameters**. This causes the Results page to load fresh with no search context.

## Solution Overview
Replace the programmatic `navigate('/results')` with `navigate(-1)` which uses the browser's history stack to return to the **exact previous page** including all URL parameters and enabling scroll restoration.

---

## Implementation Steps

### Step 1: Update RestaurantHeader Back Button
**File:** `src/components/RestaurantHeader.tsx`

Change the `handleBack` function from:
```typescript
const handleBack = () => {
  navigate('/results');
};
```

To:
```typescript
const handleBack = () => {
  // Use browser history to return to the exact previous page
  // This preserves URL parameters (search, location, filters) and enables scroll restoration
  navigate(-1);
};
```

This single change ensures:
- All URL parameters (location, categories, radius, offers filter, etc.) are preserved
- The scroll restoration hook will properly restore the scroll position (since `navigationType` will be `'POP'`)
- Map view state is preserved (since the Results page reads from URL params)

### Step 2: Add Fallback for Direct Navigation
For cases where users land directly on a restaurant page (no history), add a fallback:

```typescript
const handleBack = () => {
  // Check if there's history to go back to
  if (window.history.length > 1) {
    navigate(-1);
  } else {
    // Fallback: navigate to results (rare edge case)
    navigate('/results');
  }
};
```

---

## How This Fixes the Issue

| Before | After |
|--------|-------|
| User at `/results?location=Williamsburg%2C%20New%20York` | Same |
| Clicks "Action Burger" | Same |
| Now at `/restaurant/action-burger` | Same |
| Clicks back button | Same |
| Navigates to `/results` (no params) | Navigates back in history to `/results?location=Williamsburg%2C%20New%20York` |
| Shows "ALL locations across the US" | Shows Williamsburg, New York results |
| Scroll at top | Scroll restored to previous position |

---

## Technical Details

**Why `navigate(-1)` works:**
- React Router's `navigate(-1)` is equivalent to `window.history.back()`
- It returns to the previous entry in the browser history stack
- The previous entry contains the full URL with all query parameters
- The existing `useScrollRestoration` hook detects `navigationType === 'POP'` and restores scroll position

**Why the current implementation fails:**
- `navigate('/results')` creates a new history entry (PUSH navigation)
- URL parameters from the previous Results page visit are not carried over
- Scroll restoration sees it as a new page, not a back navigation

---

## Files Changed
1. `src/components/RestaurantHeader.tsx` - Update `handleBack` function (1 line change)

## Testing Checklist
After implementation, verify:
1. Search for "Williamsburg, New York" on mobile
2. Click on a restaurant (e.g., Action Burger)
3. Tap the back arrow in the header
4. Confirm the search location shows "Williamsburg, New York" (not all locations)
5. Confirm the same results appear
6. Confirm scroll position is restored (if you scrolled down in the list)
7. Confirm map view is preserved
