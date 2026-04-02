

## Fix: Persistent Cache Strategy Overhaul

### The root problem

Every `useQuery` in the app (31 files, 175+ queries) is automatically persisted to `localStorage` because `PersistQueryClientProvider` persists **all** queries by default. This means:

- Non-JSON-safe data (Sets, Maps, Date objects) silently corrupts on deserialization
- Stale data from old code versions causes crashes after deploys
- The only fix has been bumping the `buster` version, which nukes **all** cached data for **all** users — a blunt instrument

Most of these queries don't benefit from persistence at all (e.g., analytics, merchant portal data, session-specific results). Only a few slow-changing datasets actually warrant surviving a page reload.

### The fix: Opt-in persistence instead of opt-out

Instead of persisting everything, we'll configure the persister to only cache specific query keys that actually benefit from it.

**Step 1: Add a `dehydrate` filter to `PersistQueryClientProvider`**

In `src/App.tsx`, add `persistOptions.dehydrateOptions.shouldDehydrateQuery` — a function that returns `true` only for a whitelist of query keys worth persisting:

- `categories` — rarely changes, used on every page
- `categories-with-merchants` — same
- `merchants` — the main search results (large but valuable to cache)
- `homepage-carousels` — homepage data

Everything else (analytics, merchant portal, reviews, events, session data) will use normal in-memory caching only, which is still governed by `staleTime` and `gcTime`.

**Step 2: No more buster bumps needed**

With only simple, JSON-safe arrays being persisted, the serialization corruption class of bugs disappears entirely. We can keep the current `buster: 'v9'` and likely never need to bump it again unless the schema of those specific cached queries changes.

### Files changed

| File | Change |
|------|--------|
| `src/App.tsx` | Add `dehydrateOptions.shouldDehydrateQuery` whitelist filter to `persistOptions` |

### What this means for users

- Pages load just as fast (the whitelisted queries still cache across sessions)
- No more "Something went wrong" crashes from corrupted cache data
- Deploys no longer require cache-busting that slows down every user's first load

