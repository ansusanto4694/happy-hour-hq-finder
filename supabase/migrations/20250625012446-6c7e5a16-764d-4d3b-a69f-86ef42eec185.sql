
-- First, we need to drop the foreign key constraint from restaurant_happy_hour table
ALTER TABLE public.restaurant_happy_hour DROP CONSTRAINT restaurant_happy_hour_store_id_fkey;

-- Drop the existing primary key constraint on restaurants table
ALTER TABLE public.restaurants DROP CONSTRAINT restaurants_pkey;

-- Add a new integer column for the new ID
ALTER TABLE public.restaurants ADD COLUMN new_id SERIAL;

-- Update the new_id to start from 1 for existing records
UPDATE public.restaurants SET new_id = 1 WHERE restaurant_name = 'Chef Papa Vietnamese Kitchen (LIC)';

-- Drop the old UUID id column
ALTER TABLE public.restaurants DROP COLUMN id;

-- Rename the new_id column to id
ALTER TABLE public.restaurants RENAME COLUMN new_id TO id;

-- Set the new id column as primary key
ALTER TABLE public.restaurants ADD PRIMARY KEY (id);

-- Update restaurant_happy_hour table to use integer instead of UUID
ALTER TABLE public.restaurant_happy_hour ADD COLUMN new_store_id INTEGER;

-- Update the new_store_id to reference the new integer ID
UPDATE public.restaurant_happy_hour SET new_store_id = 1 WHERE store_id = '7eeebd53-f3e2-4ab6-ab27-7a5bd5b5de2f';

-- Drop the old UUID store_id column
ALTER TABLE public.restaurant_happy_hour DROP COLUMN store_id;

-- Rename the new_store_id column to store_id
ALTER TABLE public.restaurant_happy_hour RENAME COLUMN new_store_id TO store_id;

-- Make store_id NOT NULL
ALTER TABLE public.restaurant_happy_hour ALTER COLUMN store_id SET NOT NULL;

-- Re-add the foreign key constraint with the new integer type
ALTER TABLE public.restaurant_happy_hour ADD CONSTRAINT restaurant_happy_hour_store_id_fkey 
  FOREIGN KEY (store_id) REFERENCES public.restaurants(id) ON DELETE CASCADE;

-- Recreate the index for better performance with the new integer type
DROP INDEX IF EXISTS idx_restaurant_happy_hour_store_id;
CREATE INDEX idx_restaurant_happy_hour_store_id ON public.restaurant_happy_hour(store_id);
