-- Fix RLS policies for user_sessions table
-- Issue: Missing SELECT policy prevents upsert operations from working properly
-- This causes session_duration to be null, is_bounce to always be true, and sessions not being tracked

-- Drop existing policies (run these one at a time in Supabase SQL Editor if needed)
DROP POLICY IF EXISTS "Allow all session creation" ON public.user_sessions;
DROP POLICY IF EXISTS "Allow session updates by session_id" ON public.user_sessions;
DROP POLICY IF EXISTS "Admins can view all sessions" ON public.user_sessions;

-- Create new SELECT policy: Allow anyone to view sessions by session_id (required for upsert)
CREATE POLICY "Anyone can view sessions by session_id"
ON public.user_sessions
FOR SELECT
TO public
USING (session_id IS NOT NULL);

-- Create INSERT policy: Allow anyone to create sessions (for anonymous tracking)
CREATE POLICY "Anyone can create sessions"
ON public.user_sessions
FOR INSERT
TO public
WITH CHECK (true);

-- Create UPDATE policy: Allow updates by session_id
CREATE POLICY "Anyone can update sessions by session_id"
ON public.user_sessions
FOR UPDATE
TO public
USING (session_id IS NOT NULL)
WITH CHECK (session_id IS NOT NULL);

-- Create admin SELECT policy: Admins can view all sessions
CREATE POLICY "Admins can view all sessions"
ON public.user_sessions
FOR SELECT
TO public
USING (is_admin());
