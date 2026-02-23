-- One-time cleanup: Purge low-value events that are no longer tracked to Supabase
-- This removes ~135K rows (~60% of user_events table), reclaiming ~80 MB of storage
DELETE FROM user_events
WHERE event_type IN ('impression', 'performance', 'hover', 'scroll');