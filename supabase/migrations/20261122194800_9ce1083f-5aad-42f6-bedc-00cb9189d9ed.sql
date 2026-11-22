-- Only touches the new events / event_schedules tables.
-- Day numbers follow the app convention: 0 = Monday ... 6 = Sunday.

-- 1) Remove cloned happy-hour events (same title repeated at one restaurant), keeping one per restaurant.
WITH hh AS (
  SELECT id, merchant_id,
         row_number() OVER (PARTITION BY merchant_id ORDER BY display_order, created_at, id) rn
  FROM public.events
  WHERE legacy_source = 'happy_hour_deals'
    AND merchant_id IN (
      SELECT merchant_id FROM public.events
      WHERE legacy_source = 'happy_hour_deals'
      GROUP BY merchant_id
      HAVING count(*) > 1 AND count(DISTINCT lower(trim(title))) = 1
    )
), dupes AS (SELECT id FROM hh WHERE rn > 1),
del_s AS (DELETE FROM public.event_schedules WHERE event_id IN (SELECT id FROM dupes))
DELETE FROM public.events WHERE id IN (SELECT id FROM dupes);

-- 2) Align time slots with the right event for restaurants with distinct menus.
-- Time-of-day splits
DELETE FROM public.event_schedules s USING public.events e
WHERE s.event_id = e.id AND e.merchant_id = 2 AND (
  (e.title LIKE 'Weekday%'   AND s.start_time <> '17:00') OR
  (e.title LIKE 'Late Night%' AND s.start_time <> '22:00'));

DELETE FROM public.event_schedules s USING public.events e
WHERE s.event_id = e.id AND e.merchant_id = 17 AND (
  (e.title LIKE 'L''Apero%' AND s.start_time <> '17:00') OR
  (e.title LIKE 'Up Late%'  AND s.start_time <> '22:00'));

-- Weekday vs weekend split
DELETE FROM public.event_schedules s USING public.events e
WHERE s.event_id = e.id AND e.merchant_id = 71 AND (
  (e.title = 'Happy Hour'         AND s.day_of_week IN (5,6)) OR
  (e.title = 'Weekend Happy Hour' AND s.day_of_week NOT IN (5,6)));

-- Day-specific specials keep only their day
DELETE FROM public.event_schedules s USING public.events e
WHERE s.event_id = e.id AND e.legacy_source = 'happy_hour_deals' AND (
  (e.merchant_id IN (12,74) AND e.title ILIKE 'Martini Monday%'   AND s.day_of_week <> 0) OR
  (e.merchant_id = 74       AND e.title ILIKE 'Margarita Monday%' AND s.day_of_week <> 0) OR
  (e.merchant_id IN (76,82) AND e.title ILIKE 'Taco Tuesday%'     AND s.day_of_week <> 1) OR
  (e.merchant_id = 76       AND e.title ILIKE 'Wings Wednesday%'  AND s.day_of_week <> 2) OR
  (e.merchant_id = 74       AND e.title ILIKE 'Jelly Thursday%'   AND s.day_of_week <> 3) OR
  (e.merchant_id = 28       AND e.title ILIKE 'Half Price Bottles%' AND s.day_of_week NOT IN (1,2)));

-- Deals whose hours fall outside every saved slot: leave them without a schedule for manual entry
DELETE FROM public.event_schedules s USING public.events e
WHERE s.event_id = e.id AND e.legacy_source = 'happy_hour_deals' AND (
  (e.merchant_id = 18  AND e.title <> 'Monday - Friday Specials (Open to 7)') OR
  (e.merchant_id = 30  AND e.title = 'Bottomless') OR
  (e.merchant_id = 49  AND e.title = 'Late Night') OR
  (e.merchant_id = 69  AND e.title = 'Late Night Specials') OR
  (e.merchant_id = 73  AND e.title ILIKE 'Sunday all day%') OR
  (e.merchant_id = 772 AND e.title = 'Bottomless Brunch'));