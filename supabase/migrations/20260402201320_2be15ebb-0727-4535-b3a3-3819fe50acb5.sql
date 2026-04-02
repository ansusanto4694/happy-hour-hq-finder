INSERT INTO public.user_sessions (
  session_id,
  device_type,
  entry_page,
  exit_page,
  first_seen,
  last_seen,
  session_duration_seconds,
  is_bounce,
  is_bot,
  is_engaged,
  engagement_score,
  user_id,
  anonymous_user_id,
  traffic_source,
  attribution_type
)
SELECT
  agg.session_id,
  CASE WHEN agg.is_mobile THEN 'mobile' ELSE 'desktop' END as device_type,
  agg.entry_page,
  agg.exit_page,
  agg.first_seen,
  agg.last_seen,
  EXTRACT(EPOCH FROM (agg.last_seen - agg.first_seen))::integer as session_duration_seconds,
  agg.event_count <= 1 as is_bounce,
  false as is_bot,
  agg.unique_pages > 1 OR EXTRACT(EPOCH FROM (agg.last_seen - agg.first_seen)) > 10 as is_engaged,
  LEAST(agg.event_count, 100)::integer as engagement_score,
  agg.user_id,
  agg.anonymous_user_id,
  'unknown_backfilled' as traffic_source,
  'first_touch' as attribution_type
FROM (
  SELECT
    ue.session_id,
    bool_or(ue.is_mobile) as is_mobile,
    (array_agg(ue.page_path ORDER BY ue.created_at ASC))[1] as entry_page,
    (array_agg(ue.page_path ORDER BY ue.created_at DESC))[1] as exit_page,
    MIN(ue.created_at) as first_seen,
    MAX(ue.created_at) as last_seen,
    COUNT(*) as event_count,
    COUNT(DISTINCT ue.page_path) as unique_pages,
    (array_agg(ue.user_id ORDER BY ue.created_at ASC) FILTER (WHERE ue.user_id IS NOT NULL))[1] as user_id,
    (array_agg(ue.anonymous_user_id ORDER BY ue.created_at ASC) FILTER (WHERE ue.anonymous_user_id IS NOT NULL))[1] as anonymous_user_id
  FROM user_events ue
  WHERE ue.created_at >= '2026-03-25'
    AND ue.created_at < '2026-04-03'
    AND NOT EXISTS (
      SELECT 1 FROM user_sessions us WHERE us.session_id = ue.session_id
    )
  GROUP BY ue.session_id
) agg
ON CONFLICT (session_id) DO NOTHING;