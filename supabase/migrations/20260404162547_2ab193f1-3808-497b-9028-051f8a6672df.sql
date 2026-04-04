ALTER TABLE happy_hour_deals DROP CONSTRAINT happy_hour_deals_menu_type_check;
ALTER TABLE happy_hour_deals ADD CONSTRAINT happy_hour_deals_menu_type_check 
  CHECK (menu_type IS NULL OR menu_type IN ('food_and_drinks', 'drinks_only'));