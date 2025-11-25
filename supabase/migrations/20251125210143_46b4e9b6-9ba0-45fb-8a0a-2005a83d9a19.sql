-- Add menu_type column to happy_hour_deals table
ALTER TABLE happy_hour_deals 
ADD COLUMN menu_type text 
CHECK (menu_type IN ('food_and_drinks', 'drinks_only'));

COMMENT ON COLUMN happy_hour_deals.menu_type IS 'Indicates if the happy hour menu includes food or is drinks-only. Values: food_and_drinks, drinks_only, or null';
