
-- Revert trigger to use anon key (same as other triggers)
CREATE OR REPLACE FUNCTION public.auto_fetch_google_rating()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  request_id BIGINT;
BEGIN
  SELECT net.http_post(
    url := 'https://gohcqazhofdhkghfxfok.supabase.co/functions/v1/fetch-google-places',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvaGNxYXpob2ZkaGtnaGZ4Zm9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTI3NzIsImV4cCI6MjA2NjM4ODc3Mn0.WY1f3u3BBDrCk2VH7RUZBHTjx49rYmYAw1ylatE0d5o"}'::JSONB,
    body := jsonb_build_object('merchantId', NEW.id)
  ) INTO request_id;

  RAISE NOTICE 'Google Places fetch triggered for merchant % (ID: %)', NEW.restaurant_name, NEW.id;
  RETURN NEW;
END;
$function$;
