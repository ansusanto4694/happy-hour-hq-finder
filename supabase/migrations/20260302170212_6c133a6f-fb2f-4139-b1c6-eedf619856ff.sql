
-- Update the trigger function to handle both INSERT and UPDATE (is_active activation)
CREATE OR REPLACE FUNCTION public.auto_fetch_google_rating()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  request_id BIGINT;
BEGIN
  -- On UPDATE, only fire when is_active changes from false to true
  IF TG_OP = 'UPDATE' THEN
    IF NOT (OLD.is_active = false AND NEW.is_active = true) THEN
      RETURN NEW;
    END IF;
    -- Skip if we already have a rating for this merchant
    IF EXISTS (SELECT 1 FROM public.merchant_google_ratings WHERE merchant_id = NEW.id) THEN
      RETURN NEW;
    END IF;
  END IF;

  SELECT net.http_post(
    url := 'https://gohcqazhofdhkghfxfok.supabase.co/functions/v1/fetch-google-places',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvaGNxYXpob2ZkaGtnaGZ4Zm9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTI3NzIsImV4cCI6MjA2NjM4ODc3Mn0.WY1f3u3BBDrCk2VH7RUZBHTjx49rYmYAw1ylatE0d5o"}'::JSONB,
    body := jsonb_build_object('merchantId', NEW.id)
  ) INTO request_id;

  RAISE NOTICE 'Google Places fetch triggered for merchant % (ID: %)', NEW.restaurant_name, NEW.id;
  RETURN NEW;
END;
$function$;

-- Drop existing INSERT-only trigger and recreate for INSERT OR UPDATE
DROP TRIGGER IF EXISTS auto_fetch_google_rating ON public."Merchant";

CREATE TRIGGER auto_fetch_google_rating
  AFTER INSERT OR UPDATE ON public."Merchant"
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_fetch_google_rating();
