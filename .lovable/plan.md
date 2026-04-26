
# Mobile Homepage Pivot — "Digital A-frame" Feed (v1)

Replace the mobile homepage hero/search with a GPS-driven, glanceable feed of what's happening nearby right now. Desktop is untouched in v1.

## Scope guardrails (locked from prior turns)
- **Mobile only.** Desktop `Index.tsx` unchanged.
- **No homepage search bar.** Search lives in the existing `MobileBottomNav` "Search" tab → `/results`.
- **No digest / email / push.** In-app feed only.
- **No offers in v1.** Happy hours + one-time events only.
- **No recurring events** in v1 (one-time `merchant_events` rows only).
- **Time window** for "Tonight": until **2:00 AM** the following day (bar close).

---

## 1. Ranking & inventory model

Three horizontally-scrollable rows, each an "A-frame" card list:

### Row 1 — "Pouring Now"
- **Source:** `merchant_happy_hour` where today's `day_of_week` matches AND current time ∈ [`happy_hour_start`, `happy_hour_end`].
- **Sort:** distance ASC. Tiebreaker: `merchant_google_ratings.rating ≥ 4.0` floats up, then review count DESC.

### Row 2 — "Starting Soon"
- **Source:** `merchant_events` where `event_date = today` AND `start_time` ∈ (now, now + 120 min].
- **Sort:** time-to-start ASC. Tiebreaker: distance ASC.

### Row 3 — "Tonight"
- **Source:** `merchant_events` where `start_time` ∈ (now + 120 min, tomorrow 02:00 local].
- **Sort:** distance ASC. Tiebreaker: start_time ASC.

### Adaptive radius
- **Pouring Now + Starting Soon:** start at **1mi**, expand to **2mi**, then **5mi** until combined items ≥ 5.
- **Tonight:** fixed **5mi** (planning-mode, proximity matters less).
- Every card shows actual distance (e.g. "0.3 mi").
- When expanded beyond 1mi, show subtle "Showing within X miles" label above the row.

---

## 2. Location resolution (NEW — GPS denial fallback)

A new `useNearMeLocation` hook orchestrates a 3-step chain and persists the resolved choice.

### State machine
1. **Asking** → show hero spinner, fire native GPS prompt.
2. **Granted (GPS)** → reverse-geocode → render feed. `source: 'gps'`.
3. **Denied / failed / unsupported** → render `LocationPrompt` empty state:
   > **Where are you?**
   > We'll show you what's pouring nearby.
   > [📍 Try location again]  [Enter neighborhood or ZIP]
   - Manual entry reuses existing `useLocationSuggestions` autocomplete (same as `SearchBar`).
   - On selection → geocode → load feed. `source: 'manual'`.
   - Persist choice to `localStorage` key `nearMeManualLocation` so it survives reloads.
4. **IP fallback** (if user dismisses manual prompt) → call existing `ip-geolocate` edge function. `source: 'ip'`. Show soft disclaimer: "Showing approximate location — [Set your neighborhood]".

### LocationStrip becomes editable
The strip ("Showing within 1 mi of West Village") is **always tappable**, regardless of source. Tap opens a small bottom sheet:
- 📍 Use my current location
- Enter a different neighborhood
- (Optional) "Reset to GPS" if currently on manual

Hook signature:
```ts
useNearMeLocation() → {
  lat: number | null,
  lng: number | null,
  label: string,           // "West Village" or "Approximate location"
  source: 'gps' | 'manual' | 'ip' | null,
  status: 'asking' | 'ready' | 'denied' | 'error',
  setManual(suggestion),
  retryGps(),
  reset(),
}
```

---

## 3. Backend — `merchant-api` edge function

Add a new action `near_me_now` to `supabase/functions/merchant-api/index.ts`.

**Input:** `{ action: 'near_me_now', lat: number, lng: number }`

**Logic:**
- Run three Haversine-filtered SQL queries in parallel against `Merchant` joined with `merchant_happy_hour`, `merchant_events`, and `merchant_google_ratings`.
- For Pouring/Starting Soon: query at 1mi, expand to 2mi, then 5mi until combined count ≥ 5.
- Apply current Eastern-Time day boundary logic (per existing `mem://analytics/date-filtering-context`) for the "until 2am" cutoff.
- Return:
```ts
{
  pouring_now: AFrameItem[],
  starting_soon: AFrameItem[],
  tonight: AFrameItem[],
  radius_used: { now_soon_miles: 1 | 2 | 5, tonight_miles: 5 }
}
```
- `AFrameItem` includes: merchant id/name/slug/logo/neighborhood, distance_miles, google rating, plus the relevant happy-hour or event payload (start/end, title, category).

Public endpoint, no auth required (consistent with existing public merchant queries via `merchant-api` per `mem://security/anti-scraping-architecture`).

---

## 4. Frontend hook — `useNearMeNow`

New `src/hooks/useNearMeNow.ts`:
- Consumes `useNearMeLocation` (does NOT call GPS directly).
- React Query: `staleTime: 60_000`, `refetchOnWindowFocus: true`.
- Query key: `['near-me-now', lat, lng]` (rounded to 3 decimals to allow cache reuse for nearby pans).
- Returns `{ pouringNow, startingSoon, tonight, radiusUsed, isLoading, error }`.

---

## 5. UI components (new, mobile-only)

All under `src/components/near-me/`:

| Component | Purpose |
|---|---|
| `NearMeNowHero.tsx` | Top gradient header. Replaces existing `Hero` on mobile. Shows greeting + `LocationStrip`. |
| `LocationStrip.tsx` | Tappable bar showing label ("Showing within 1 mi of West Village") + edit affordance. |
| `LocationEditSheet.tsx` | Bottom sheet (Radix Dialog) with manual entry + retry-GPS options. Uses `useLocationSuggestions`. |
| `LocationPrompt.tsx` | Full-bleed empty state when GPS denied & no manual choice yet. |
| `LiveFeedRow.tsx` | Horizontal scroll row with title, optional "within X mi" label, snap-to-card. |
| `AFrameCard.tsx` | The card itself: logo, name, neighborhood, distance, status pill ("Pouring until 7pm" / "Starts in 18 min" / "Trivia · 8:00 PM"). Tap → `/restaurant/:slug`. |
| `DiscoveryChips.tsx` | Client-side category filter chips (All, Trivia, Live Music, Karaoke, Watch Party, Comedy). Filters `tonight` + `starting_soon` rows in-memory. |

Empty states per row:
- Pouring Now empty → "Nothing pouring within 5 miles right now. Check back later."
- Starting Soon empty → hide the row entirely (don't show empty placeholder).
- Tonight empty → "No events listed tonight nearby."

---

## 6. `Index.tsx` mobile branch rewrite

Replace the entire `if (isMobile)` block. Structure:

```tsx
<NearMeNowHero />
{location.status === 'denied' && !manualSet
  ? <LocationPrompt />
  : <>
      <DiscoveryChips />
      <LiveFeedRow title="Pouring Now" items={pouringNow} ... />
      <LiveFeedRow title="Starting Soon" items={startingSoon} ... />
      <LiveFeedRow title="Tonight" items={tonight} ... />
      <RecentlyViewed />  {/* keep existing carousel below */}
    </>}
<Footer />
```

Desktop branch is **unchanged**.

---

## 7. Analytics

New events via existing `useAnalytics` / `trackFunnel`:
- `near_me_feed_viewed` — `{ source, radius_now_soon, radius_tonight, counts: {pouring, soon, tonight} }`
- `near_me_card_clicked` — `{ row, merchant_id, distance_miles, position }`
- `near_me_radius_expanded` — `{ from, to }`
- `near_me_chip_filter` — `{ category }`
- `near_me_location_source` — `{ source: 'gps' | 'manual' | 'ip' }`
- `near_me_location_denied` — fired once per session
- `near_me_location_manual_set` — `{ label }`

---

## 8. Files touched

**New:**
- `src/hooks/useNearMeLocation.ts`
- `src/hooks/useNearMeNow.ts`
- `src/components/near-me/NearMeNowHero.tsx`
- `src/components/near-me/LocationStrip.tsx`
- `src/components/near-me/LocationEditSheet.tsx`
- `src/components/near-me/LocationPrompt.tsx`
- `src/components/near-me/LiveFeedRow.tsx`
- `src/components/near-me/AFrameCard.tsx`
- `src/components/near-me/DiscoveryChips.tsx`

**Modified:**
- `supabase/functions/merchant-api/index.ts` — add `near_me_now` action.
- `src/pages/Index.tsx` — replace mobile branch.

**Untouched:**
- Desktop `Index.tsx` branch, all `/results`, all merchant profile pages, `MobileBottomNav` (Search tab already routes to `/results`).

---

## Out of scope (explicitly deferred)
- Offers / promo codes
- Recurring event expansion
- Digest emails / push notifications
- Personalization / "based on your history"
- Editorial boosting
- Map view on homepage (one tap to `/results` covers spatial mode)
- Desktop redesign

## Open follow-ups (post-v1)
- A "View on map" affordance per row that deep-links to `/results` with the relevant filter pre-applied.
- Recurring event support once one-time event volume validates demand.
- Offers row once redemption tracking has more data.
