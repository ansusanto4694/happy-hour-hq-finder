-- Remove user role visibility for regular users
-- Only admins should be able to view roles in this consumer application

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Now only the "Admins can view all roles" policy remains for SELECT
-- This ensures regular users cannot see role information at all