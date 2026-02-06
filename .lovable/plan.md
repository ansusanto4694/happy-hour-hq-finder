

## Fix: Visiting `/restaurant/641` Redirects to the Old (Wrong) Name

### What's Happening

Your app has a **caching system** that saves restaurant data in your browser's local storage for up to 24 hours to make pages load faster. Here's the chain of events:

1. Before the rename, you (or someone) visited `/restaurant/641`
2. The app saved the restaurant data -- including the old slug `peak-restaurant-hudson-yards-new-york` -- in your browser's cache
3. You renamed the restaurant to "Quin Bar" -- the database correctly updated the slug to `quin-bar-hudson-yards-new-york`
4. Now when you visit `/restaurant/641` again, the app finds the **cached (outdated) data** first, sees the old slug, and immediately redirects you to `/restaurant/peak-restaurant-hudson-yards-new-york`
5. That old slug no longer exists in the database, so the page shows "Restaurant not found"

**The database is fine** -- the slug is correct (`quin-bar-hudson-yards-new-york`). The problem is the app trusts its local cache too much when deciding where to redirect.

### The Fix (Two Parts)

**Part 1: Don't redirect using stale cached data**

When someone visits a numeric ID URL like `/restaurant/641`, the redirect to the slug URL should only happen after we've confirmed the data is fresh from the database -- not from a 24-hour-old cache.

The app already tracks whether data is "fresh" or "from cache" internally. We just need to check that flag before redirecting.

**Part 2: After renaming, redirect the editor to the new URL**

This is the previously discussed fix. When an admin renames a restaurant, the editor should automatically navigate to the new URL so they never land on a stale page.

### What Changes

| What | Change |
|------|--------|
| Visiting `/restaurant/641` | Will wait for fresh database data before redirecting to the slug URL -- no more redirecting to stale cached slugs |
| Renaming a restaurant | After saving, the app redirects you to the new correct URL automatically |
| Cache behavior | Still caches for performance, but won't blindly trust cached data for redirect decisions |
| Everything else | Unchanged -- mobile, search results, map, etc. all work the same |

### Technical Details

**File 1: `src/pages/RestaurantProfile.tsx`**

- Add `isStale` and `dataUpdatedAt` from the `useQuery` return value to determine if current data is from the cache or a fresh fetch
- Modify the redirect `useEffect` (line 230) to only redirect when the data is confirmed fresh (not stale). This means:
  - `isStale === false` or we compare `dataUpdatedAt` to ensure it was fetched after the component mounted
  - This prevents the race condition where cached data triggers a redirect before the real database response arrives
- Alternative simpler approach: use `isFetching` -- only redirect when `!isFetching` (meaning the network request has completed and we have the final, fresh result)

**File 2: `src/components/restaurant-profile-editor/useRestaurantMutations.ts`**

- Modify `updateRestaurantMutation` to use `.select('slug').single()` so it returns the new slug after the update
- Return the mutation result (including new slug) from the mutation function

**File 3: `src/components/RestaurantProfileEditor.tsx`**

- Import `useNavigate` from react-router-dom
- After a successful save in `handleSubmit`, check if name/city/neighborhood changed
- If so, read the new slug from the mutation result and call `navigate('/restaurant/${newSlug}', { replace: true })` to redirect to the correct URL

