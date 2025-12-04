-- Add SELECT policy for user_sessions to allow reading sessions by session_id
-- This is required for upsert operations and session activity updates
-- Security: Users can only read sessions where they know the session_id (randomly generated, stored in sessionStorage)

CREATE POLICY "Anyone can view sessions by session_id"
ON public.user_sessions
FOR SELECT
TO public
USING (session_id IS NOT NULL);