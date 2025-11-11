-- Add neighborhood column to Merchant table
ALTER TABLE public."Merchant" 
ADD COLUMN neighborhood text NULL;

-- Add index for faster filtering by neighborhood
CREATE INDEX idx_merchant_neighborhood ON public."Merchant"(neighborhood) 
WHERE neighborhood IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public."Merchant".neighborhood IS 'Neighborhood name extracted from Mapbox geocoding API during address geocoding';