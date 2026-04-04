

## Fix: Ensure Google ratings pull in reliably on merchant activation

### The Problem
When you activate a merchant, two async triggers fire simultaneously:
1. **Geocoding** (looks up lat/lng from the address)
2. **Google Places fetch** (uses lat/lng to find the Google listing)

The Google fetch often finishes before geocoding saves the coordinates. Without coordinates, the distance check fails, marking it "no match" — and it never retries.

### The Fix (one migration)

Update the `auto_fetch_google_rating` trigger so it **does not fire on activation directly**. Instead, it fires when **coordinates are saved** (i.e., after geocoding completes). This guarantees lat/lng are available when the Google Places search runs.

The trigger will fire when:
- **Coordinates are newly populated** (geocoding just finished) — this is the main path
- **Merchant is activated AND already has coordinates** (e.g., re-activation of a previously geocoded merchant)

It will also **overwrite stale `no_match` records** — if a previous attempt failed because coordinates were missing, the new attempt (with coordinates now present) will replace it.

### Additionally: re-fetch current broken records

After the trigger fix, we'll delete existing `no_match` records for merchants that now have valid coordinates. The next coordinate-related update (or a manual re-trigger) will repopulate them correctly. Alternatively, we can run a one-time batch re-fetch via the edge function's existing "backfill" mode after clearing those records.

### Scope
- One migration: update `auto_fetch_google_rating()` trigger function
- One data cleanup: delete `no_match` records for merchants with valid coordinates so they get re-fetched
- No app code changes

