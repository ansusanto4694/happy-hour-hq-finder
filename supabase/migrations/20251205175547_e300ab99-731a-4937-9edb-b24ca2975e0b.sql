-- Add enhanced UTM tracking columns to user_sessions
ALTER TABLE public.user_sessions
ADD COLUMN IF NOT EXISTS first_touch_utm_source text,
ADD COLUMN IF NOT EXISTS first_touch_utm_medium text,
ADD COLUMN IF NOT EXISTS first_touch_utm_campaign text,
ADD COLUMN IF NOT EXISTS first_touch_utm_content text,
ADD COLUMN IF NOT EXISTS first_touch_utm_term text,
ADD COLUMN IF NOT EXISTS utm_landing_page text,
ADD COLUMN IF NOT EXISTS attribution_type text DEFAULT 'first_touch';

-- Add comment for documentation
COMMENT ON COLUMN public.user_sessions.first_touch_utm_source IS 'Original UTM source from first visit (never overwritten)';
COMMENT ON COLUMN public.user_sessions.first_touch_utm_medium IS 'Original UTM medium from first visit (never overwritten)';
COMMENT ON COLUMN public.user_sessions.first_touch_utm_campaign IS 'Original UTM campaign from first visit (never overwritten)';
COMMENT ON COLUMN public.user_sessions.utm_landing_page IS 'Page URL where UTM parameters were captured';
COMMENT ON COLUMN public.user_sessions.attribution_type IS 'Attribution model: first_touch, last_touch, or multi_touch';