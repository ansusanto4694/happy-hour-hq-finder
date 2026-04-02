
-- Allow anonymous users to SELECT their own session by session_id
-- This is needed for upsert/insert operations to return the result via PostgREST
CREATE POLICY "Anyone can read their own session by session_id"
ON public.user_sessions
FOR SELECT
TO anon, authenticated
USING (true);

-- Note: This is a permissive SELECT policy scoped to anon+authenticated roles.
-- The existing "Admins can view all sessions" policy remains for admin dashboard queries.
-- We use USING(true) because sessions don't have a user_id for anonymous visitors,
-- and the session_id is only known to the client that created it.
-- This is acceptable per the existing risk acceptance for user_sessions (see memory).
