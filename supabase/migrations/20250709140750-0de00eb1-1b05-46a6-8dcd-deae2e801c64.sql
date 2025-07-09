-- Add is_active column to Merchant table
ALTER TABLE public."Merchant" 
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- Add index for better query performance when filtering by is_active
CREATE INDEX idx_merchant_is_active ON public."Merchant"(is_active);