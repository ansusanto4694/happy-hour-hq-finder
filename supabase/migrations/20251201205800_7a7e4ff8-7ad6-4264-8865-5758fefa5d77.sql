-- Add composite index on user_events for optimized session event queries
-- This optimizes queries that count events by session_id and filter by event_type
CREATE INDEX IF NOT EXISTS idx_user_events_session_event_type 
ON user_events(session_id, event_type);

-- Add comment explaining the index purpose
COMMENT ON INDEX idx_user_events_session_event_type IS 
'Optimizes engagement metric queries that count events by session and filter by event type (e.g., page_view counts)';