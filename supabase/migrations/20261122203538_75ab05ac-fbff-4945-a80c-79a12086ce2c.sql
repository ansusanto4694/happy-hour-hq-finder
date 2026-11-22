DO $$
DECLARE
  legacy_before jsonb;
  legacy_after jsonb;
  brunch_id uuid;
BEGIN
  SELECT jsonb_object_agg(name, checksum) INTO legacy_before FROM (
    SELECT 'Merchant' name, md5(string_agg(row_to_json(t)::text,'|' ORDER BY id)) checksum FROM public."Merchant" t
    UNION ALL SELECT 'happy_hour_deals',md5(string_agg(row_to_json(t)::text,'|' ORDER BY id)) FROM public.happy_hour_deals t
    UNION ALL SELECT 'merchant_happy_hour',md5(string_agg(row_to_json(t)::text,'|' ORDER BY id)) FROM public.merchant_happy_hour t
    UNION ALL SELECT 'merchant_events',md5(string_agg(row_to_json(t)::text,'|' ORDER BY id)) FROM public.merchant_events t
  ) snapshots;

  -- The closure correction applies only to the parallel event dataset.
  DELETE FROM public.event_schedules WHERE event_id IN (SELECT id FROM public.events WHERE merchant_id = 94);
  DELETE FROM public.events WHERE merchant_id = 94;

  SELECT id INTO brunch_id FROM public.events WHERE merchant_id = 18 AND title = 'Bottomless Brunch' ORDER BY created_at LIMIT 1;
  IF brunch_id IS NULL THEN
    INSERT INTO public.events (merchant_id,event_type,title,description,menu_type,source_url,source_label,display_order,legacy_source,is_verified)
    VALUES (18,'happy_hour','Bottomless Brunch',E'Available Saturday 12–4 PM ($40 per person) & Sunday 12–4 PM ($35 per person).\n\nIncludes all drafts, mimosas & a choice of one food item:\n\n- 8 wings with a side of waffle fries, tots or onion rings\n- Breakfast Burrito\n- Breakfast Bowl','food_and_drinks','https://www.downthehatchnyc.com/specials/','Official specials menu',8,'menu_alignment',false)
    RETURNING id INTO brunch_id;
  ELSE
    UPDATE public.events SET description=E'Available Saturday 12–4 PM ($40 per person) & Sunday 12–4 PM ($35 per person).\n\nIncludes all drafts, mimosas & a choice of one food item:\n\n- 8 wings with a side of waffle fries, tots or onion rings\n- Breakfast Burrito\n- Breakfast Bowl',menu_type='food_and_drinks',source_url='https://www.downthehatchnyc.com/specials/',source_label='Official specials menu',is_active=true WHERE id=brunch_id;
  END IF;
  DELETE FROM public.event_schedules WHERE event_id=brunch_id;
  INSERT INTO public.event_schedules (event_id,schedule_type,day_of_week,start_time,end_time,recurrence_rule,legacy_source)
  VALUES (brunch_id,'recurring',5,'12:00','16:00','weekly','menu_alignment'),(brunch_id,'recurring',6,'12:00','16:00','weekly','menu_alignment');

  UPDATE public.event_schedules SET start_time='08:00',end_time='16:00'
  WHERE event_id='0bf55c1b-5595-4662-9886-a2df814263d8' AND schedule_type='recurring' AND day_of_week IN (5,6);
  UPDATE public.events SET source_url='https://citycoffeebar.com/food-dinner-brunch-happy-hour-menu',source_label='Official brunch menu' WHERE id='0bf55c1b-5595-4662-9886-a2df814263d8' AND merchant_id=772;

  -- Concrete regression checks: fail the entire correction if any rule is violated.
  IF EXISTS (SELECT 1 FROM public.events WHERE merchant_id=94) THEN RAISE EXCEPTION 'Savoi still has events'; END IF;
  IF (SELECT count(*) FROM public.event_schedules WHERE event_id=brunch_id)<>2 OR
     (SELECT count(*) FROM public.event_schedules WHERE event_id=brunch_id AND day_of_week IN (5,6) AND start_time='12:00' AND end_time='16:00' AND recurrence_rule='weekly')<>2 THEN
    RAISE EXCEPTION 'Down The Hatch brunch must have Saturday and Sunday noon–4 PM schedules';
  END IF;
  IF (SELECT count(*) FROM public.event_schedules WHERE event_id='0bf55c1b-5595-4662-9886-a2df814263d8' AND day_of_week IN (5,6) AND start_time='08:00' AND end_time='16:00')<>2 THEN
    RAISE EXCEPTION 'City Coffee brunch must have Saturday and Sunday 8 AM–4 PM schedules';
  END IF;
  SELECT jsonb_object_agg(name, checksum) INTO legacy_after FROM (
    SELECT 'Merchant' name, md5(string_agg(row_to_json(t)::text,'|' ORDER BY id)) checksum FROM public."Merchant" t
    UNION ALL SELECT 'happy_hour_deals',md5(string_agg(row_to_json(t)::text,'|' ORDER BY id)) FROM public.happy_hour_deals t
    UNION ALL SELECT 'merchant_happy_hour',md5(string_agg(row_to_json(t)::text,'|' ORDER BY id)) FROM public.merchant_happy_hour t
    UNION ALL SELECT 'merchant_events',md5(string_agg(row_to_json(t)::text,'|' ORDER BY id)) FROM public.merchant_events t
  ) snapshots;
  IF legacy_before IS DISTINCT FROM legacy_after THEN RAISE EXCEPTION 'Legacy data changed'; END IF;
END $$;