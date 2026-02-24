
CREATE OR REPLACE FUNCTION public.auto_fetch_google_rating()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  request_id BIGINT;
  service_role_key TEXT;
BEGIN
  -- Use the service role key for trusted internal calls
  service_role_key := current_setting('app.settings.service_role_key', true);
  IF service_role_key IS NULL OR service_role_key = '' THEN
    -- Fallback: read from vault if available, otherwise use a direct reference
    service_role_key := current_setting('supabase.service_role_key', true);
  END IF;

  SELECT net.http_post(
    url := 'https://gohcqazhofdhkghfxfok.supabase.co/functions/v1/fetch-google-places',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('service_role.key', true)
    ),
    body := jsonb_build_object('merchantId', NEW.id)
  ) INTO request_id;

  RAISE NOTICE 'Google Places fetch triggered for merchant % (ID: %)', NEW.restaurant_name, NEW.id;
  RETURN NEW;
END;
$function$;
