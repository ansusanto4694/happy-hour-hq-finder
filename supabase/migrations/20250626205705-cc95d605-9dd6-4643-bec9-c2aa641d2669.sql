
-- Add display_order column to happy_hour_deals table
ALTER TABLE public.happy_hour_deals 
ADD COLUMN display_order INTEGER DEFAULT 0;

-- Update existing records to have sequential display_order values using a subquery
WITH ordered_deals AS (
  SELECT id, row_number() OVER (PARTITION BY restaurant_id ORDER BY created_at) as new_order
  FROM public.happy_hour_deals
)
UPDATE public.happy_hour_deals 
SET display_order = ordered_deals.new_order
FROM ordered_deals
WHERE public.happy_hour_deals.id = ordered_deals.id;

-- Create index for better performance when ordering
CREATE INDEX idx_happy_hour_deals_display_order ON public.happy_hour_deals(restaurant_id, display_order);
