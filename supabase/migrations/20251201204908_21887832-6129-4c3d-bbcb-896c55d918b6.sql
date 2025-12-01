-- Remove unused counter columns from user_sessions table
-- We now query actual events from user_events table instead

ALTER TABLE user_sessions 
DROP COLUMN IF EXISTS page_views,
DROP COLUMN IF EXISTS total_events;