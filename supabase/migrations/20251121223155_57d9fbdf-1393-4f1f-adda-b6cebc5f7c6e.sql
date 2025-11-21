
-- Add traffic_source and engagement metrics to user_sessions table
ALTER TABLE user_sessions 
ADD COLUMN IF NOT EXISTS traffic_source TEXT DEFAULT 'direct',
ADD COLUMN IF NOT EXISTS is_engaged BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS engagement_score INTEGER DEFAULT 0;

-- Add comment explaining engagement_score
COMMENT ON COLUMN user_sessions.engagement_score IS 'Engagement score: 0-100 based on session duration, page views, and interactions';

-- Add comment explaining traffic_source
COMMENT ON COLUMN user_sessions.traffic_source IS 'Traffic source: direct, organic, social, referral, email, paid, other';

-- Create index for analytics queries
CREATE INDEX IF NOT EXISTS idx_user_sessions_traffic_source ON user_sessions(traffic_source);
CREATE INDEX IF NOT EXISTS idx_user_sessions_engagement ON user_sessions(is_engaged, engagement_score);
CREATE INDEX IF NOT EXISTS idx_user_sessions_bounce ON user_sessions(is_bounce);

-- Update existing sessions with traffic_source based on referrer_category
UPDATE user_sessions
SET traffic_source = CASE
  WHEN referrer_category = 'search_engine' THEN 'organic'
  WHEN referrer_category = 'social_media' THEN 'social'
  WHEN referrer_category = 'referral' THEN 'referral'
  WHEN referrer_category = 'direct' THEN 'direct'
  WHEN referrer_category = 'internal' THEN 'internal'
  WHEN utm_source IS NOT NULL THEN 'campaign'
  ELSE 'direct'
END
WHERE traffic_source = 'direct';

-- Calculate engagement metrics for existing sessions
UPDATE user_sessions
SET 
  is_engaged = (
    (page_views > 1 OR session_duration_seconds > 30) 
    AND NOT is_bounce
    AND NOT is_bot
  ),
  engagement_score = LEAST(100, GREATEST(0, 
    (page_views * 10) + 
    (COALESCE(session_duration_seconds, 0) / 6) +
    (CASE WHEN total_events > 5 THEN 20 ELSE 0 END)
  )),
  is_bounce = (
    (page_views <= 1 AND COALESCE(session_duration_seconds, 0) < 10)
    OR (COALESCE(session_duration_seconds, 0) = 0 AND page_views = 0)
  )
WHERE is_engaged IS NULL OR engagement_score = 0;
