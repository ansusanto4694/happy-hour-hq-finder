-- Remove the overly permissive SELECT policy that allows anyone to read sessions
DROP POLICY IF EXISTS "Anyone can view sessions by session_id" ON public.user_sessions;

-- The existing "Admins can view all sessions" policy already handles admin access
-- No new policies needed - admins can view, anyone can insert/update their own sessions