-- Create location cache table for storing geocoded results
CREATE TABLE public.location_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_input TEXT NOT NULL UNIQUE,
  canonical_city TEXT NOT NULL,
  canonical_state TEXT NOT NULL,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_location_cache_input ON public.location_cache(original_input);

-- Enable RLS (public read access for caching)
ALTER TABLE public.location_cache ENABLE ROW LEVEL SECURITY;

-- Policy to allow anyone to read cached locations
CREATE POLICY "Anyone can view location cache" 
ON public.location_cache 
FOR SELECT 
USING (true);

-- Policy to allow the service role to insert/update cache entries
CREATE POLICY "Service role can manage location cache" 
ON public.location_cache 
FOR ALL 
USING (auth.role() = 'service_role');