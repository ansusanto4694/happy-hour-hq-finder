-- Phase 2: Security Hardening

-- 1. Fix restaurants_public view - recreate without SECURITY DEFINER (use default SECURITY INVOKER)
DROP VIEW IF EXISTS public.restaurants_public;
CREATE VIEW public.restaurants_public AS
SELECT 
  id, 
  restaurant_name, 
  street_address, 
  street_address_line_2, 
  city, 
  state, 
  zip_code, 
  phone_number, 
  website, 
  latitude, 
  longitude, 
  logo_url, 
  is_active, 
  created_at, 
  updated_at
FROM public."Merchant"
WHERE is_active = true;

-- 2. Fix create_user_events_partition - add search_path
CREATE OR REPLACE FUNCTION public.create_user_events_partition(partition_date date)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  partition_name text;
  start_date date;
  end_date date;
BEGIN
  -- Generate partition name based on year and month
  partition_name := 'user_events_' || to_char(partition_date, 'YYYY_MM');
  
  -- Calculate partition boundaries (first day of month to first day of next month)
  start_date := date_trunc('month', partition_date)::date;
  end_date := (date_trunc('month', partition_date) + interval '1 month')::date;
  
  -- Create partition if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_class WHERE relname = partition_name
  ) THEN
    EXECUTE format(
      'CREATE TABLE IF NOT EXISTS %I PARTITION OF user_events
       FOR VALUES FROM (%L) TO (%L)',
      partition_name,
      start_date,
      end_date
    );
    
    RAISE NOTICE 'Created partition % for period % to %', partition_name, start_date, end_date;
  END IF;
END;
$function$;

-- 3. Fix maintain_user_events_partitions - add search_path
CREATE OR REPLACE FUNCTION public.maintain_user_events_partitions()
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  i integer;
  partition_date date;
BEGIN
  -- Create partitions for current month and next 2 months
  FOR i IN 0..2 LOOP
    partition_date := (date_trunc('month', CURRENT_DATE) + (i || ' months')::interval)::date;
    PERFORM create_user_events_partition(partition_date);
  END LOOP;
END;
$function$;

-- 4. Fix update_updated_at_column - add search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;