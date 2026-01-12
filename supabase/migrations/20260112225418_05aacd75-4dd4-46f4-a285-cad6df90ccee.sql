-- Fix bounce rate tracking: Add SELECT policy for user_events and backfill data

-- Add SELECT policy for user_events to allow reading events by session_id
-- This is required for updateSessionActivity to count page views correctly
CREATE POLICY "Anyone can view events by session_id"
ON public.user_events
FOR SELECT
TO public
USING (session_id IS NOT NULL);

-- Backfill: Fix sessions with NULL duration (treat as bounces)
UPDATE user_sessions
SET is_bounce = true
WHERE session_duration_seconds IS NULL 
  AND (is_bounce = false OR is_bounce IS NULL);

-- Backfill: Fix sessions with very short duration (<10s) and single page view
UPDATE user_sessions us
SET is_bounce = true
WHERE session_duration_seconds < 10
  AND (is_bounce = false OR is_bounce IS NULL)
  AND (SELECT COUNT(*) FROM user_events ue 
       WHERE ue.session_id = us.session_id 
       AND ue.event_type = 'page_view') <= 1;