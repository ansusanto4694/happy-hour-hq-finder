
-- Update the 'Pub' category to become a subcategory of 'Bar'
UPDATE public.categories 
SET parent_id = (SELECT id FROM public.categories WHERE slug = 'bar' AND parent_id IS NULL)
WHERE slug = 'pub' AND parent_id IS NULL;
