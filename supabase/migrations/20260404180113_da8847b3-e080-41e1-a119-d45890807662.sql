CREATE OR REPLACE FUNCTION public.auto_fetch_google_rating()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  request_id BIGINT;
BEGIN
  -- On INSERT: only fire if merchant already has coordinates
  IF TG_OP = 'INSERT' THEN
    IF NEW.latitude IS NULL OR NEW.longitude IS NULL THEN
      RETURN NEW;  -- geocoding will trigger us later via UPDATE
    END IF;
  END IF;

  -- On UPDATE: fire only for relevant changes
  IF TG_OP = 'UPDATE' THEN
    -- Case 1: coordinates just populated (geocoding finished)
    IF (OLD.latitude IS NULL AND NEW.latitude IS NOT NULL) THEN
      -- Continue to fetch (this is the main path)
      NULL;
    -- Case 2: merchant activated AND already has coordinates
    ELSIF (OLD.is_active = false AND NEW.is_active = true AND NEW.latitude IS NOT NULL) THEN
      -- Continue to fetch
      NULL;
    ELSE
      RETURN NEW;  -- not a relevant change, skip
    END IF;

    -- Skip if we already have a good confidence rating (high/medium/low)
    IF EXISTS (
      SELECT 1 FROM public.merchant_google_ratings
      WHERE merchant_id = NEW.id
        AND match_confidence IS NOT NULL
        AND match_confidence != 'no_match'
    ) THEN
      RETURN NEW;
    END IF;
  END IF;

  -- Delete any stale no_match record so the edge function can upsert a fresh one
  DELETE FROM public.merchant_google_ratings
  WHERE merchant_id = NEW.id AND match_confidence = 'no_match';

  SELECT net.http_post(
    url := 'https://gohcqazhofdhkghfxfok.supabase.co/functions/v1/fetch-google-places',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvaGNxYXpob2ZkaGtnaGZ4Zm9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTI3NzIsImV4cCI6MjA2NjM4ODc3Mn0.WY1f3u3BBDrCk2VH7RUZBHTjx49rYmYAw1ylatE0d5o"}'::JSONB,
    body := jsonb_build_object('merchantId', NEW.id)
  ) INTO request_id;

  RAISE NOTICE 'Google Places fetch triggered for merchant % (ID: %)', NEW.restaurant_name, NEW.id;
  RETURN NEW;
END;
$$;