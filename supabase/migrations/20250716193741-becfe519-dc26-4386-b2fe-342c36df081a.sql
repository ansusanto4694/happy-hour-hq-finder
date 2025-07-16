-- Add logo_url column to Merchant table
ALTER TABLE public."Merchant" ADD COLUMN logo_url TEXT;

-- Create storage bucket for restaurant logos
INSERT INTO storage.buckets (id, name, public) VALUES ('restaurant-logos', 'restaurant-logos', true);

-- Create policies for restaurant logo uploads
CREATE POLICY "Anyone can view restaurant logos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'restaurant-logos');

CREATE POLICY "Admins can upload restaurant logos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'restaurant-logos' AND public.is_admin());

CREATE POLICY "Admins can update restaurant logos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'restaurant-logos' AND public.is_admin());

CREATE POLICY "Admins can delete restaurant logos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'restaurant-logos' AND public.is_admin());