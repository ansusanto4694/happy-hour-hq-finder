
Diagnosis

Your query returns no rows because the filter is correct for current page-view events, but this condition removes everything:

```sql
AND ue.merchant_id IS NOT NULL
```

What I verified
- `user_events` has current data through `2026-03-31`
- There are many recent restaurant profile page loads:
  - `event_type = 'page_view'`
  - `event_category = 'page_view'`
  - `event_action = 'page_load'`
  - `page_path LIKE '/restaurant/%'`
- But for those rows:
  - `merchant_id IS NULL` on all recent restaurant page loads
  - count with `merchant_id IS NOT NULL` = `0`
  - count with `merchant_id IS NULL` = `11103`

Why this is happening in the app
- In `src/App.tsx`, page views are tracked globally with `trackPageView()` on route change
- In `src/utils/analytics.ts`, `trackPageView()` only includes `merchant_id` if it is explicitly passed in
- In `src/pages/RestaurantProfile.tsx`, the app tracks:
  - `funnel_events.profile_viewed` with `merchantId`
  - `scroll_depth` with `merchantId`
- But it does not call `trackPageView({ merchantId: restaurant.id })`

So:
- restaurant page views are being logged
- but they are logged with the merchant encoded in `page_path`, not in `user_events.merchant_id`

Use this query instead

This preserves your output shape and derives the merchant from the restaurant slug in the URL:

```sql
SELECT
  DATE(ue.created_at) AS day_of,
  CASE WHEN us.is_bot THEN 'bot' ELSE 'human' END AS user_type,
  m.id AS merchant_id,
  m.restaurant_name AS merchant_name,
  COUNT(*) AS view_count
FROM public.user_events ue
LEFT JOIN public.user_sessions us
  ON us.session_id = ue.session_id
LEFT JOIN public."Merchant" m
  ON m.slug = regexp_replace(ue.page_path, '^/restaurant/', '')
WHERE ue.event_type = 'page_view'
  AND ue.event_category = 'page_view'
  AND ue.event_action = 'page_load'
  AND ue.page_path LIKE '/restaurant/%'
  AND m.id IS NOT NULL
GROUP BY 1, 2, 3, 4
ORDER BY day_of DESC;
```

Why this one works
- it uses the actual current page-view event definition
- it maps `/restaurant/{slug}` back to the merchant record
- I verified this returns rows for recent dates including `2026-03-31`

Important caveat
- This query depends on the current slug matching the slug that was in the URL when the event was recorded
- If a merchant slug changes later, some historical rows may stop matching

More durable alternative
If you want a merchant-linked metric that already stores `merchant_id`, use `funnel_events`:

```sql
SELECT
  DATE(fe.created_at) AS day_of,
  'human' AS user_type,
  fe.merchant_id,
  m.restaurant_name AS merchant_name,
  COUNT(*) AS view_count
FROM public.funnel_events fe
LEFT JOIN public."Merchant" m
  ON m.id = fe.merchant_id
WHERE fe.funnel_step = 'profile_viewed'
  AND fe.merchant_id IS NOT NULL
GROUP BY 1, 2, 3, 4
ORDER BY day_of DESC;
```

Recommended next implementation
If you want this reporting to be stable long-term, the app should be updated so restaurant page views call:

```ts
trackPageView({ merchantId: restaurant.id })
```

That would let future reporting use `user_events.merchant_id` directly without reconstructing from the URL.
