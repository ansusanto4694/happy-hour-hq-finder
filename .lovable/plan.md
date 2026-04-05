

## Fix: Remove 200-result cap for legitimate app users

### Problem
The `merchant-api` Edge Function has a hard cap of `MAX_RESULTS = 200` (line 24 of `supabase/functions/merchant-api/index.ts`). This was added as an anti-scraping measure, but it's also limiting all app users — signed in or not — to only 200 merchants in search results.

Additionally, Supabase's default query limit is 1,000 rows, so even removing the 200 cap would hit that ceiling if you have more than 1,000 merchants.

### Solution
Increase `MAX_RESULTS` to 1,000 (Supabase's max per query) for the app's own requests. The other anti-scraping protections (rate limiting, bot UA blocking, RLS lockdown) remain in place and are the real security layer. The 200 cap was overly aggressive for normal app usage.

### Changes

**File: `supabase/functions/merchant-api/index.ts`**
- Change `MAX_RESULTS` from `200` to `1000`
- This single constant controls the `.limit()` on the main search query (line 192)

### Why this is safe
- Rate limiting (60 req/min per IP) still prevents bulk scraping
- Bot User-Agent blocking still rejects known scrapers
- RLS still blocks direct anon key access to the database
- The 1,000 limit matches Supabase's built-in query cap, so there's no performance risk beyond what Supabase already handles

