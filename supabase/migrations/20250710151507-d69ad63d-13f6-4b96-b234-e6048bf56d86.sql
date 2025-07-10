-- Clear bad cache entries so they get re-geocoded with correct borough names
DELETE FROM public.location_cache WHERE original_input IN ('manhattan, ny', 'new york, ny');