
-- Normalize state: "New York" -> "NY", trim whitespace
UPDATE "Merchant" SET state = 'NY' WHERE state = 'New York';
UPDATE "Merchant" SET state = trim(state) WHERE state != trim(state);

-- Normalize lowercase cities
UPDATE "Merchant" SET city = 'Coral Gables' WHERE city = 'coral gables';
UPDATE "Merchant" SET city = 'Long Island City' WHERE city = 'long island city';
UPDATE "Merchant" SET city = 'Ardmore' WHERE city = 'ardmore';
UPDATE "Merchant" SET city = 'Miami' WHERE city = 'miami';
