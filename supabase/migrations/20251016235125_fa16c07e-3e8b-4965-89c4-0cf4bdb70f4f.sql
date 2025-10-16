-- Add viewport dimensions to user_sessions table
ALTER TABLE public.user_sessions 
ADD COLUMN IF NOT EXISTS viewport_width integer,
ADD COLUMN IF NOT EXISTS viewport_height integer;

-- Remove unnecessary fields from user_events table
ALTER TABLE public.user_events
DROP COLUMN IF EXISTS viewport_width,
DROP COLUMN IF EXISTS viewport_height,
DROP COLUMN IF EXISTS page_url,
DROP COLUMN IF EXISTS referrer_url,
DROP COLUMN IF EXISTS element_id,
DROP COLUMN IF EXISTS element_text,
DROP COLUMN IF EXISTS element_class;

-- Add comment to document optimization
COMMENT ON TABLE user_events IS 'Optimized analytics events table - viewport data moved to user_sessions, redundant fields removed';