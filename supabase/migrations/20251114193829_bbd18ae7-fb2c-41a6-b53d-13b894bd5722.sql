-- Add anonymous_user_id column to user_sessions for persistent user tracking
ALTER TABLE public.user_sessions
ADD COLUMN anonymous_user_id TEXT;

-- Create index for efficient retention queries
CREATE INDEX idx_user_sessions_anonymous_user 
ON public.user_sessions(anonymous_user_id, created_at DESC);

-- Add helpful comment
COMMENT ON COLUMN public.user_sessions.anonymous_user_id 
IS 'Persistent anonymous user identifier stored in localStorage for retention tracking';