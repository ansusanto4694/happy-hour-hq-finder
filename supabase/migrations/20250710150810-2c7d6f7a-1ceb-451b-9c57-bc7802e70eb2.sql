-- Clear existing location cache entries with incorrect state formats
-- This will force them to be re-geocoded with the corrected format
DELETE FROM public.location_cache WHERE canonical_state IN ('US-NY', 'New York');

-- Add a comment for future reference
COMMENT ON TABLE public.location_cache IS 'Caches geocoded location results to reduce API calls and ensure consistent location normalization';