-- Backfill historical session data from user_events
-- This fixes sessions that show 0 page_views and 0 total_events due to race conditions

UPDATE user_sessions s
SET 
  page_views = COALESCE(subq.actual_page_views, 0),
  total_events = COALESCE(subq.actual_events, 0)
FROM (
  SELECT 
    session_id,
    COUNT(*) as actual_events,
    COUNT(CASE WHEN event_type = 'page_view' THEN 1 END) as actual_page_views
  FROM user_events
  GROUP BY session_id
) subq
WHERE s.session_id = subq.session_id
  AND (s.page_views = 0 OR s.total_events = 0);