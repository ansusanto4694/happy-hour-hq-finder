-- Add missing INSERT policy for profiles table
-- This allows users to create their own profile during sign up
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);