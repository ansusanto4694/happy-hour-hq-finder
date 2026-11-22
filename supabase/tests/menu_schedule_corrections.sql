-- Read-only regression checks for the parallel event dataset.
SELECT 'Savoi removed from new event data' AS rule,
  NOT EXISTS (SELECT 1 FROM public.events WHERE merchant_id = 94) AS passed
UNION ALL
SELECT 'Down The Hatch brunch Saturday and Sunday noon–4 PM',
  (SELECT count(*) FROM public.events WHERE merchant_id = 18 AND title = 'Bottomless Brunch') = 1
  AND (SELECT count(*) FROM public.event_schedules s JOIN public.events e ON e.id = s.event_id
       WHERE e.merchant_id = 18 AND e.title = 'Bottomless Brunch') = 2
  AND (SELECT array_agg(s.day_of_week ORDER BY s.day_of_week) FROM public.event_schedules s
       JOIN public.events e ON e.id = s.event_id
       WHERE e.merchant_id = 18 AND e.title = 'Bottomless Brunch'
         AND s.start_time = '12:00' AND s.end_time = '16:00' AND s.recurrence_rule = 'weekly') = ARRAY[5,6]::smallint[]
UNION ALL
SELECT 'City Coffee brunch Saturday and Sunday 8 AM–4 PM',
  (SELECT array_agg(s.day_of_week ORDER BY s.day_of_week) FROM public.event_schedules s
       JOIN public.events e ON e.id = s.event_id
       WHERE e.merchant_id = 772 AND e.title = 'Bottomless Brunch'
         AND s.start_time = '08:00' AND s.end_time = '16:00' AND s.recurrence_rule = 'weekly') = ARRAY[5,6]::smallint[];