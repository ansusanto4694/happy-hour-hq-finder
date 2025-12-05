-- Fix search_path for slugify function
CREATE OR REPLACE FUNCTION public.slugify(input_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  result TEXT;
BEGIN
  result := lower(input_text);
  result := regexp_replace(result, '\([^)]*\)', '', 'g');
  result := regexp_replace(result, '^the\s+', '', 'i');
  result := regexp_replace(result, '[''´`]', '', 'g');
  result := regexp_replace(result, '[^a-z0-9]+', '-', 'g');
  result := trim(both '-' from result);
  result := regexp_replace(result, '-+', '-', 'g');
  RETURN result;
END;
$$;

-- Fix search_path for generate_merchant_slug function
CREATE OR REPLACE FUNCTION public.generate_merchant_slug(
  p_restaurant_name TEXT,
  p_neighborhood TEXT,
  p_city TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  name_slug TEXT;
  neighborhood_slug TEXT;
  city_slug TEXT;
  full_slug TEXT;
BEGIN
  name_slug := slugify(p_restaurant_name);
  city_slug := slugify(p_city);
  
  IF p_neighborhood IS NOT NULL AND length(trim(p_neighborhood)) > 0 THEN
    neighborhood_slug := slugify(p_neighborhood);
    full_slug := name_slug || '-' || neighborhood_slug || '-' || city_slug;
  ELSE
    full_slug := name_slug || '-' || city_slug;
  END IF;
  
  RETURN full_slug;
END;
$$;