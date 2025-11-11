-- Add UTM tracking columns to user_sessions table
ALTER TABLE public.user_sessions
ADD COLUMN IF NOT EXISTS utm_source text,
ADD COLUMN IF NOT EXISTS utm_medium text,
ADD COLUMN IF NOT EXISTS utm_campaign text,
ADD COLUMN IF NOT EXISTS utm_content text,
ADD COLUMN IF NOT EXISTS utm_term text;

-- Add index for faster querying by UTM source
CREATE INDEX IF NOT EXISTS idx_user_sessions_utm_source ON public.user_sessions(utm_source);

-- Add index for faster querying by UTM campaign
CREATE INDEX IF NOT EXISTS idx_user_sessions_utm_campaign ON public.user_sessions(utm_campaign);

COMMENT ON COLUMN public.user_sessions.utm_source IS 'UTM source parameter (e.g., google, newsletter, facebook)';
COMMENT ON COLUMN public.user_sessions.utm_medium IS 'UTM medium parameter (e.g., cpc, email, social)';
COMMENT ON COLUMN public.user_sessions.utm_campaign IS 'UTM campaign parameter (e.g., spring_sale, launch)';
COMMENT ON COLUMN public.user_sessions.utm_content IS 'UTM content parameter for A/B testing';
COMMENT ON COLUMN public.user_sessions.utm_term IS 'UTM term parameter for paid search keywords';