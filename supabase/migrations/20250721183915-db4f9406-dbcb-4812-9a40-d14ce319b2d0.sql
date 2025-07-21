-- Add neighborhood support to location_cache table
ALTER TABLE public.location_cache ADD COLUMN location_type TEXT DEFAULT 'city';
ALTER TABLE public.location_cache ADD COLUMN neighborhood_name TEXT;
ALTER TABLE public.location_cache ADD COLUMN north_lat NUMERIC;
ALTER TABLE public.location_cache ADD COLUMN south_lat NUMERIC;
ALTER TABLE public.location_cache ADD COLUMN east_lng NUMERIC;
ALTER TABLE public.location_cache ADD COLUMN west_lng NUMERIC;

-- Add index for better performance on bounding box queries
CREATE INDEX IF NOT EXISTS idx_location_cache_bounds ON public.location_cache (north_lat, south_lat, east_lng, west_lng);

-- Add index for location type filtering
CREATE INDEX IF NOT EXISTS idx_location_cache_type ON public.location_cache (location_type);