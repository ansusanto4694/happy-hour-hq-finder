

# Fix: Analytics Page Redirect Due to Auth Race Condition

## Problem
When navigating to `/analytics`, the `AdminRoute` guard redirects to `/` because of a race condition between `getSession()` and `onAuthStateChange()` in the auth provider. The `loading` flag gets set to `false` before `isAdmin` has been resolved.

## Root Cause
In `src/hooks/useAuth.tsx` (lines 108-175):
- `getSession()` starts `fetchProfile()`, which sets `isFetchingProfile = true`
- `onAuthStateChange` fires with `INITIAL_SESSION` and tries `fetchProfile()` inside a `setTimeout`
- The second call exits early due to the `isFetchingProfile` guard, but its `finally` block still sets `loading = false`
- At that point, `isAdmin` hasn't been resolved yet, so `AdminRoute` redirects

## Solution
Modify `useAuth.tsx` so that `loading` is only set to `false` once — after the profile and role data have actually been fetched. Two changes:

### 1. Make `fetchProfile` return a boolean indicating if it actually ran
If the fetch was skipped due to the guard, the caller should NOT set `loading = false`.

### 2. Only set `loading = false` in `onAuthStateChange` if `fetchProfile` actually completed
Change the `setTimeout` block so it checks whether `fetchProfile` was skipped. If skipped, don't touch `loading` — let the `getSession` path handle it.

## Files Changed
- **`src/hooks/useAuth.tsx`** — Fix the race condition by having `fetchProfile` return whether it actually ran, and only setting `loading = false` in the `onAuthStateChange` handler when the fetch wasn't skipped.

## Technical Details

```text
Before (race condition):
  getSession ──> fetchProfile (sets guard) ──────────> resolves isAdmin ──> loading=false
  onAuthStateChange ──> setTimeout ──> fetchProfile (guard hit, returns) ──> loading=false  [TOO EARLY]

After (fixed):
  getSession ──> fetchProfile (sets guard) ──────────> resolves isAdmin ──> loading=false
  onAuthStateChange ──> setTimeout ──> fetchProfile (guard hit, returns false) ──> skips loading=false
```

The fix is minimal: `fetchProfile` returns `true` if it ran, `false` if skipped. The `onAuthStateChange` handler only sets `loading = false` in its `finally` block if the fetch actually ran (returned `true`).

