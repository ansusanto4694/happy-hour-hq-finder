-- Fix favorites RLS policy to be PERMISSIVE (default) instead of RESTRICTIVE
-- This allows users to view their own favorites without requiring admin role

DROP POLICY IF EXISTS "Users can view their own favorites" ON favorites;

CREATE POLICY "Users can view their own favorites"
ON favorites FOR SELECT
USING (auth.uid() = user_id);