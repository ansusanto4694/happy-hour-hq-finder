-- Add bot detection fields to user_sessions table
ALTER TABLE public.user_sessions 
ADD COLUMN IF NOT EXISTS is_bot boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS bot_type text;

-- Add index for bot filtering queries
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_bot ON public.user_sessions(is_bot);

-- Add index for bot type analysis
CREATE INDEX IF NOT EXISTS idx_user_sessions_bot_type ON public.user_sessions(bot_type) WHERE bot_type IS NOT NULL;

COMMENT ON COLUMN public.user_sessions.is_bot IS 'Whether this session is from an automated bot/crawler';
COMMENT ON COLUMN public.user_sessions.bot_type IS 'Category of bot: search_engine, seo_tool, social_media, monitoring, unknown, malicious';