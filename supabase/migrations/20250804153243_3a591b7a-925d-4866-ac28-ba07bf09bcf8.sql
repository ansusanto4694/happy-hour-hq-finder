-- Fix privilege escalation vulnerability: Replace overly permissive profile update policy

-- Drop the current policy that allows users to update all fields including role
DROP POLICY "Users can update their own profile" ON public.profiles;

-- Create restricted user update policy (excludes role field)
-- Users can only update their own profile data, but role must remain unchanged
CREATE POLICY "Users can update their own profile data" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND 
  role = (SELECT role FROM public.profiles WHERE id = auth.uid())
);

-- Create admin-only role management policy
-- Only admins can update any user's role
CREATE POLICY "Only admins can update user roles" 
ON public.profiles 
FOR UPDATE 
USING (is_admin())
WITH CHECK (is_admin());