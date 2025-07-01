
-- Add website column to the Merchant table
ALTER TABLE public."Merchant" 
ADD COLUMN website TEXT;

-- Add a comment to describe the column
COMMENT ON COLUMN public."Merchant".website IS 'Website URL for the merchant';
