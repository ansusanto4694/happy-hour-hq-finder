-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'restaurant_owner', 'user');

-- Create profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  phone_number TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user role (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Create security definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- RLS policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.get_current_user_role() = 'admin');

-- Update Merchant table RLS policies to restrict editing to admins only
DROP POLICY IF EXISTS "Anyone can update restaurants" ON public."Merchant";
DROP POLICY IF EXISTS "Anyone can insert restaurants" ON public."Merchant";
DROP POLICY IF EXISTS "Anyone can delete restaurants" ON public."Merchant";

CREATE POLICY "Only admins can update restaurants"
ON public."Merchant"
FOR UPDATE
TO authenticated
USING (public.is_admin());

CREATE POLICY "Only admins can insert restaurants"
ON public."Merchant"
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can delete restaurants"
ON public."Merchant"
FOR DELETE
TO authenticated
USING (public.is_admin());

-- Update happy_hour_deals RLS policies to restrict editing to admins only
DROP POLICY IF EXISTS "Allow all operations for now" ON public.happy_hour_deals;

CREATE POLICY "Only admins can manage happy hour deals"
ON public.happy_hour_deals
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Update merchant_happy_hour RLS policies to restrict editing to admins only
DROP POLICY IF EXISTS "Anyone can update restaurant happy hours" ON public.merchant_happy_hour;
DROP POLICY IF EXISTS "Anyone can insert restaurant happy hours" ON public.merchant_happy_hour;
DROP POLICY IF EXISTS "Anyone can delete restaurant happy hours" ON public.merchant_happy_hour;

CREATE POLICY "Only admins can update restaurant happy hours"
ON public.merchant_happy_hour
FOR UPDATE
TO authenticated
USING (public.is_admin());

CREATE POLICY "Only admins can insert restaurant happy hours"
ON public.merchant_happy_hour
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can delete restaurant happy hours"
ON public.merchant_happy_hour
FOR DELETE
TO authenticated
USING (public.is_admin());

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, phone_number, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'phone_number', ''),
    COALESCE((NEW.raw_user_meta_data ->> 'role')::app_role, 'user')
  );
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at trigger to profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();