-- Add optimized indexes for analytics queries on user_events table

-- Composite index for event action queries over time (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_user_events_action_created 
ON user_events (event_action, created_at DESC);

-- Composite index for event category queries over time
CREATE INDEX IF NOT EXISTS idx_user_events_category_created 
ON user_events (event_category, created_at DESC);

-- Composite index for session analysis
CREATE INDEX IF NOT EXISTS idx_user_events_session_created 
ON user_events (session_id, created_at DESC);

-- Partial indexes for high-cardinality filters (only index non-null values)
CREATE INDEX IF NOT EXISTS idx_user_events_merchant_id 
ON user_events (merchant_id, created_at DESC) 
WHERE merchant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_events_carousel_id 
ON user_events (carousel_id, created_at DESC) 
WHERE carousel_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_events_search_term 
ON user_events (search_term, created_at DESC) 
WHERE search_term IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_events_location_query 
ON user_events (location_query, created_at DESC) 
WHERE location_query IS NOT NULL;

-- Index for device segmentation queries
CREATE INDEX IF NOT EXISTS idx_user_events_mobile_created 
ON user_events (is_mobile, created_at DESC);

-- Index for user-specific analytics (when filtering by user_id)
CREATE INDEX IF NOT EXISTS idx_user_events_user_created 
ON user_events (user_id, created_at DESC) 
WHERE user_id IS NOT NULL;

-- Composite index for event type queries
CREATE INDEX IF NOT EXISTS idx_user_events_type_created 
ON user_events (event_type, created_at DESC);

-- Optimize user_sessions table queries
CREATE INDEX IF NOT EXISTS idx_user_sessions_created 
ON user_sessions (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_sessions_referrer_category 
ON user_sessions (referrer_category, created_at DESC) 
WHERE referrer_category IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_sessions_device_created 
ON user_sessions (device_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_sessions_utm_source 
ON user_sessions (utm_source, created_at DESC) 
WHERE utm_source IS NOT NULL;

-- Note: Automated monthly partitioning setup
-- This creates a function to automatically create new partitions for user_events
-- Partitions will be created monthly to maintain query performance

-- Create a function to generate future partitions automatically
CREATE OR REPLACE FUNCTION create_user_events_partition(partition_date date)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  partition_name text;
  start_date date;
  end_date date;
BEGIN
  -- Generate partition name based on year and month
  partition_name := 'user_events_' || to_char(partition_date, 'YYYY_MM');
  
  -- Calculate partition boundaries (first day of month to first day of next month)
  start_date := date_trunc('month', partition_date)::date;
  end_date := (date_trunc('month', partition_date) + interval '1 month')::date;
  
  -- Create partition if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_class WHERE relname = partition_name
  ) THEN
    EXECUTE format(
      'CREATE TABLE IF NOT EXISTS %I PARTITION OF user_events
       FOR VALUES FROM (%L) TO (%L)',
      partition_name,
      start_date,
      end_date
    );
    
    RAISE NOTICE 'Created partition % for period % to %', partition_name, start_date, end_date;
  END IF;
END;
$$;

-- Create a maintenance function to ensure next 3 months of partitions exist
CREATE OR REPLACE FUNCTION maintain_user_events_partitions()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  i integer;
  partition_date date;
BEGIN
  -- Create partitions for current month and next 2 months
  FOR i IN 0..2 LOOP
    partition_date := (date_trunc('month', CURRENT_DATE) + (i || ' months')::interval)::date;
    PERFORM create_user_events_partition(partition_date);
  END LOOP;
END;
$$;

-- Note: To enable partitioning, the user_events table needs to be converted to a partitioned table
-- This requires recreating the table, which should be done carefully in production
-- For now, we've created the helper functions. To actually enable partitioning:
-- 1. Create new partitioned table structure
-- 2. Migrate existing data
-- 3. Swap tables
-- This is commented out to avoid data loss, but the framework is in place:

/*
-- CAUTION: Only run this in a maintenance window with proper backup
-- Step 1: Rename existing table
ALTER TABLE user_events RENAME TO user_events_old;

-- Step 2: Create new partitioned table
CREATE TABLE user_events (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  session_id text NOT NULL,
  user_id uuid,
  event_type text NOT NULL,
  event_category text NOT NULL,
  event_action text NOT NULL,
  event_label text,
  page_path text NOT NULL,
  merchant_id integer,
  carousel_id uuid,
  search_term text,
  location_query text,
  metadata jsonb,
  is_mobile boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Step 3: Create initial partitions (last 3 months + next 3 months)
SELECT create_user_events_partition((CURRENT_DATE - interval '3 months')::date);
SELECT create_user_events_partition((CURRENT_DATE - interval '2 months')::date);
SELECT create_user_events_partition((CURRENT_DATE - interval '1 month')::date);
SELECT maintain_user_events_partitions();

-- Step 4: Migrate data from old table
INSERT INTO user_events SELECT * FROM user_events_old;

-- Step 5: Recreate indexes on partitioned table (they'll automatically apply to all partitions)
-- (Indexes from above would be recreated here)

-- Step 6: Drop old table (after verification)
-- DROP TABLE user_events_old;
*/

-- For now, just ensure we have the maintenance function ready
-- Run this manually or via pg_cron to create future partitions:
-- SELECT maintain_user_events_partitions();

COMMENT ON FUNCTION create_user_events_partition(date) IS 
'Creates a monthly partition for user_events table for the given date';

COMMENT ON FUNCTION maintain_user_events_partitions() IS 
'Ensures partitions exist for current month and next 2 months. Run monthly via cron job.';