-- Add anonymous_user_id column to user_events for persistent user tracking across events
ALTER TABLE public.user_events
ADD COLUMN anonymous_user_id TEXT;

-- Create index for efficient retention queries by anonymous user
CREATE INDEX idx_user_events_anonymous_user 
ON public.user_events(anonymous_user_id, created_at DESC);

-- Add helpful comment
COMMENT ON COLUMN public.user_events.anonymous_user_id 
IS 'Persistent anonymous user identifier for tracking user behavior and retention without authentication';