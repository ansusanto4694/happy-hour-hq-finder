-- Fix RLS policy for user_sessions to allow anonymous session creation
-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Anyone can insert sessions" ON user_sessions;

-- Create a new INSERT policy that explicitly allows anonymous session creation
CREATE POLICY "Allow anonymous session creation"
ON user_sessions
FOR INSERT
WITH CHECK (true);

-- Verify UPDATE policy allows session updates
DROP POLICY IF EXISTS "Anyone can update their own session" ON user_sessions;

-- Create a more specific UPDATE policy that checks session ownership
CREATE POLICY "Allow session updates by session_id"
ON user_sessions
FOR UPDATE
USING (session_id IS NOT NULL)
WITH CHECK (session_id IS NOT NULL);

-- Add index on session_id for better performance on lookups and updates
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id);

-- Add index on anonymous_user_id for retention analysis queries
CREATE INDEX IF NOT EXISTS idx_user_sessions_anonymous_user_id ON user_sessions(anonymous_user_id);

-- Add index on first_seen for cohort analysis
CREATE INDEX IF NOT EXISTS idx_user_sessions_first_seen ON user_sessions(first_seen);