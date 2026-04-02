

## Bug #2: WriteReview page — Remaining issues with slug URLs

### What was already fixed
The merchant lookup query in WriteReview already supports both numeric IDs and slugs (lines 62-83). That part is working.

### Issues still present

**Issue A: `useReview(merchantId)` fires with `merchantId = 0` before merchant data loads**

On line 86: `const merchantId = merchant?.id ?? 0;`

The `useReview` hook is called immediately with `merchantId = 0`. Inside the hook (line 135), it queries `merchant_reviews` with `merchant_id = 0`, which will never match anything. This means:
- The hook's loading state resolves before the real merchant ID is known
- If auto-save triggers before the merchant query resolves, it inserts a review with `merchant_id: 0`

**Fix:** Guard the `useReview` hook's internal `loadExistingReview` effect and `saveReviewInternal` function against `merchantId === 0`. The load effect (line 123) should add `if (!merchantId) { setIsLoading(false); return; }`, and the save function (line 46) should add `if (!merchantId) return false;` at the top.

**Issue B: "Back to Restaurant" link uses numeric ID instead of slug**

Line 159: `to={/restaurant/${merchantId}}` navigates to `/restaurant/69` instead of `/restaurant/mommys-bar-east-williamsburg-brooklyn`. While this works (the profile page handles numeric-to-slug redirects), it causes an unnecessary redirect hop.

**Fix:** Change to `to={/restaurant/${merchant.slug || merchantId}}` to use the slug directly since it's already fetched in the merchant query.

### Files to change

**`src/hooks/useReview.ts`** — Two guards:
1. In `saveReviewInternal` (line 46): add `if (!merchantId) return false;` before the content check
2. In `loadExistingReview` effect (line 123): add `merchantId` to the dependency array and guard with `if (!merchantId)` early return

**`src/pages/WriteReview.tsx`** — One change:
1. Line 159: Change `to={/restaurant/${merchantId}}` to `to={/restaurant/${merchant?.slug || id}}`

