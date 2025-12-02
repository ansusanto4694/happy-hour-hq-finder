-- Fix profiles RLS policy to be PERMISSIVE (default) instead of RESTRICTIVE
-- This allows users to view their own profile without requiring admin role

DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;

CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);