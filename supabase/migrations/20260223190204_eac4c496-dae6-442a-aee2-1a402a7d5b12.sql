
-- Create merchant_google_ratings table
CREATE TABLE public.merchant_google_ratings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id integer NOT NULL UNIQUE REFERENCES public."Merchant"(id) ON DELETE CASCADE,
  google_place_id text,
  google_rating numeric(2,1),
  google_review_count integer,
  google_rating_url text,
  match_confidence text DEFAULT 'no_match' CHECK (match_confidence IN ('high', 'medium', 'low', 'no_match')),
  fetched_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_merchant_google_ratings_merchant_id ON public.merchant_google_ratings(merchant_id);
CREATE INDEX idx_merchant_google_ratings_fetched_at ON public.merchant_google_ratings(fetched_at);

-- Enable RLS
ALTER TABLE public.merchant_google_ratings ENABLE ROW LEVEL SECURITY;

-- Anyone can view (public trust signal)
CREATE POLICY "Anyone can view google ratings"
  ON public.merchant_google_ratings
  FOR SELECT
  USING (true);

-- Only service_role can manage
CREATE POLICY "Service role can manage google ratings"
  ON public.merchant_google_ratings
  FOR ALL
  USING (auth.role() = 'service_role'::text)
  WITH CHECK (auth.role() = 'service_role'::text);

-- Updated_at trigger
CREATE TRIGGER update_merchant_google_ratings_updated_at
  BEFORE UPDATE ON public.merchant_google_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-fetch trigger function for new merchants
CREATE OR REPLACE FUNCTION public.auto_fetch_google_rating()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
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
$$;

-- Attach trigger to Merchant table
CREATE TRIGGER auto_fetch_google_rating_on_insert
  AFTER INSERT ON public."Merchant"
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_fetch_google_rating();
