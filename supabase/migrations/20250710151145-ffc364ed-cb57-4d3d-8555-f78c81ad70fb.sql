-- Clear the bad Brooklyn cache entry so it gets re-geocoded correctly
DELETE FROM public.location_cache WHERE original_input = 'brooklyn, ny' AND canonical_city = 'New York';