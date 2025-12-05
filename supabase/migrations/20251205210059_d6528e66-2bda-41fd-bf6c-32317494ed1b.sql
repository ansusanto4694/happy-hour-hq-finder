-- Add slug column WITHOUT unique constraint first
ALTER TABLE public."Merchant" 
ADD COLUMN IF NOT EXISTS slug TEXT;

-- Create index for fast slug lookups (not unique yet)
DROP INDEX IF EXISTS idx_merchant_slug;
CREATE INDEX idx_merchant_slug ON public."Merchant" (slug);

-- Create a function to generate slugs from text (if not exists)
CREATE OR REPLACE FUNCTION public.slugify(input_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  result TEXT;
BEGIN
  result := lower(input_text);
  -- Remove content in parentheses
  result := regexp_replace(result, '\([^)]*\)', '', 'g');
  -- Remove "The " prefix
  result := regexp_replace(result, '^the\s+', '', 'i');
  -- Replace special characters with nothing
  result := regexp_replace(result, '[''´`]', '', 'g');
  -- Replace non-alphanumeric with hyphens
  result := regexp_replace(result, '[^a-z0-9]+', '-', 'g');
  -- Remove leading/trailing hyphens
  result := trim(both '-' from result);
  -- Replace multiple hyphens with single
  result := regexp_replace(result, '-+', '-', 'g');
  RETURN result;
END;
$$;

-- Create a function to generate full merchant slug
CREATE OR REPLACE FUNCTION public.generate_merchant_slug(
  p_restaurant_name TEXT,
  p_neighborhood TEXT,
  p_city TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
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

-- Generate slugs for all merchants (overwrite any existing)
UPDATE public."Merchant"
SET slug = generate_merchant_slug(restaurant_name, neighborhood, city)
WHERE is_active = true;

-- Handle duplicates by appending the ID for non-first occurrences
WITH ranked AS (
  SELECT id, slug, ROW_NUMBER() OVER (PARTITION BY slug ORDER BY id) as rn
  FROM public."Merchant"
  WHERE slug IS NOT NULL
)
UPDATE public."Merchant" m
SET slug = m.slug || '-' || m.id::text
FROM ranked r
WHERE m.id = r.id AND r.rn > 1;

-- Now add the unique constraint
ALTER TABLE public."Merchant" 
ADD CONSTRAINT merchant_slug_unique UNIQUE (slug);