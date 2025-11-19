-- Fix circular RLS policy on user_roles table
-- The issue: the SELECT policy queries user_roles to check if user is admin,
-- which causes infinite recursion

-- Drop the problematic policies
DROP POLICY IF EXISTS "Admins can view all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can insert user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can update user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can delete user roles" ON public.user_roles;

-- Create non-recursive policies
-- Users can view their own roles (no recursion)
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Only admins can manage roles using the has_role function
-- This works because has_role is SECURITY DEFINER and bypasses RLS
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Simplify user_sessions INSERT policy to be completely permissive
-- This is an analytics table that should accept all anonymous sessions
DROP POLICY IF EXISTS "Allow anonymous session creation" ON public.user_sessions;

CREATE POLICY "Allow all session creation"
ON public.user_sessions
FOR INSERT
WITH CHECK (true);