
-- Add latitude and longitude columns to the Merchant table
ALTER TABLE Merchant 
ADD COLUMN latitude DECIMAL(10, 8),
ADD COLUMN longitude DECIMAL(11, 8);

-- Add an index for efficient location-based queries
CREATE INDEX idx_merchant_location ON Merchant (latitude, longitude);

-- Add a column to track when geocoding was last performed
ALTER TABLE Merchant 
ADD COLUMN geocoded_at TIMESTAMP WITH TIME ZONE;
