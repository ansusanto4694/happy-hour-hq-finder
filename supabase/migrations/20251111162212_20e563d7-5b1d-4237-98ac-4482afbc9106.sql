-- Add referrer categorization columns to user_sessions table
ALTER TABLE public.user_sessions
ADD COLUMN IF NOT EXISTS referrer_category text,
ADD COLUMN IF NOT EXISTS referrer_platform text;

-- Add index for faster querying by referrer category
CREATE INDEX IF NOT EXISTS idx_user_sessions_referrer_category ON public.user_sessions(referrer_category);

-- Add index for faster querying by referrer platform
CREATE INDEX IF NOT EXISTS idx_user_sessions_referrer_platform ON public.user_sessions(referrer_platform);

COMMENT ON COLUMN public.user_sessions.referrer_category IS 'Categorized referrer type: search_engine, social_media, direct, referral, internal';
COMMENT ON COLUMN public.user_sessions.referrer_platform IS 'Specific platform name: google, facebook, reddit, etc.';