
-- 1. Add category_type column to categories
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS category_type text NOT NULL DEFAULT 'venue_type';

-- 2. Set category_type on existing L1 parents
UPDATE public.categories SET category_type = 'venue_type' WHERE id IN (
  'd12930d9-3ce1-4436-829d-b9357e7414c0',
  '0256e680-c4dd-4a05-82f2-8513a6d959ae'
);

-- 3. Create new L1 parents
INSERT INTO public.categories (name, slug, parent_id, category_type) VALUES
  ('Cuisine', 'cuisine', NULL, 'cuisine'),
  ('Dietary', 'dietary', NULL, 'dietary'),
  ('Experience', 'experience', NULL, 'experience'),
  ('Beverage', 'beverage', NULL, 'beverage'),
  ('Cafe', 'cafe', NULL, 'venue_type');

-- 4. Reparent existing cuisine items from Restaurant to Cuisine
UPDATE public.categories SET parent_id = (SELECT id FROM public.categories WHERE slug = 'cuisine' AND parent_id IS NULL), category_type = 'cuisine'
WHERE slug IN ('american','argentine','bbq','brazilian','caribbean','chinese','colombian','cuban','dim-sum','ethiopian','filipino','french','greek','indian','indonesian','italian','japanese','korean','lebanese','malaysian','mediterranean','mexican','middle-eastern','moroccan','persian','peruvian','pizza','seafood','southern','spanish','steakhouse','sushi','tacos','thai','turkish','vietnamese');

-- 5. Reparent dietary items
UPDATE public.categories SET parent_id = (SELECT id FROM public.categories WHERE slug = 'dietary' AND parent_id IS NULL), category_type = 'dietary'
WHERE slug IN ('vegan','vegetarian','gluten-free','farm-to-table','organic');

-- 6. Reparent beverage items
UPDATE public.categories SET parent_id = (SELECT id FROM public.categories WHERE slug = 'beverage' AND parent_id IS NULL), category_type = 'beverage'
WHERE slug IN ('coffee','tea');

-- 7. Reparent brunch to Experience
UPDATE public.categories SET parent_id = (SELECT id FROM public.categories WHERE slug = 'experience' AND parent_id IS NULL), category_type = 'experience'
WHERE slug = 'brunch';

-- 8. Set category_type on existing Bar children
UPDATE public.categories SET category_type = 'venue_type'
WHERE parent_id = 'd12930d9-3ce1-4436-829d-b9357e7414c0';

-- 9. Insert new Bar subcategories
INSERT INTO public.categories (name, slug, parent_id, category_type) VALUES
  ('Dive Bar', 'dive-bar', 'd12930d9-3ce1-4436-829d-b9357e7414c0', 'venue_type'),
  ('Speakeasy', 'speakeasy', 'd12930d9-3ce1-4436-829d-b9357e7414c0', 'venue_type'),
  ('Lounge', 'lounge', 'd12930d9-3ce1-4436-829d-b9357e7414c0', 'venue_type'),
  ('Nightclub', 'nightclub', 'd12930d9-3ce1-4436-829d-b9357e7414c0', 'venue_type'),
  ('Hotel Bar', 'hotel-bar', 'd12930d9-3ce1-4436-829d-b9357e7414c0', 'venue_type'),
  ('Rooftop Bar', 'rooftop-bar', 'd12930d9-3ce1-4436-829d-b9357e7414c0', 'venue_type'),
  ('Tiki Bar', 'tiki-bar', 'd12930d9-3ce1-4436-829d-b9357e7414c0', 'venue_type'),
  ('Brewery/Brewpub', 'brewery-brewpub', 'd12930d9-3ce1-4436-829d-b9357e7414c0', 'venue_type'),
  ('Beer Garden', 'beer-garden', 'd12930d9-3ce1-4436-829d-b9357e7414c0', 'venue_type'),
  ('Karaoke Bar', 'karaoke-bar', 'd12930d9-3ce1-4436-829d-b9357e7414c0', 'venue_type'),
  ('Piano Bar', 'piano-bar', 'd12930d9-3ce1-4436-829d-b9357e7414c0', 'venue_type'),
  ('Pool Hall', 'pool-hall', 'd12930d9-3ce1-4436-829d-b9357e7414c0', 'venue_type'),
  ('Hookah Lounge', 'hookah-lounge', 'd12930d9-3ce1-4436-829d-b9357e7414c0', 'venue_type');

-- 10. Insert new Restaurant subcategories
INSERT INTO public.categories (name, slug, parent_id, category_type) VALUES
  ('Fine Dining', 'fine-dining', '0256e680-c4dd-4a05-82f2-8513a6d959ae', 'venue_type'),
  ('Casual Dining', 'casual-dining', '0256e680-c4dd-4a05-82f2-8513a6d959ae', 'venue_type'),
  ('Fast Casual', 'fast-casual', '0256e680-c4dd-4a05-82f2-8513a6d959ae', 'venue_type'),
  ('Bistro', 'bistro', '0256e680-c4dd-4a05-82f2-8513a6d959ae', 'venue_type'),
  ('Gastropub', 'gastropub', '0256e680-c4dd-4a05-82f2-8513a6d959ae', 'venue_type');

-- 11. Insert new Cuisine items
INSERT INTO public.categories (name, slug, parent_id, category_type)
SELECT v.name, v.slug, (SELECT id FROM public.categories WHERE slug = 'cuisine' AND parent_id IS NULL), 'cuisine'
FROM (VALUES
  ('African', 'african'),
  ('Asian', 'asian'),
  ('Cajun/Creole', 'cajun-creole'),
  ('Dominican', 'dominican'),
  ('German', 'german'),
  ('Hawaiian/Polynesian', 'hawaiian-polynesian'),
  ('Jamaican', 'jamaican'),
  ('Latin', 'latin'),
  ('Puerto Rican', 'puerto-rican'),
  ('Ramen', 'ramen'),
  ('Salvadoran', 'salvadoran'),
  ('Soul Food', 'soul-food'),
  ('Taiwanese', 'taiwanese'),
  ('Tex-Mex', 'tex-mex')
) AS v(name, slug);

-- 12. Insert new Experience items
INSERT INTO public.categories (name, slug, parent_id, category_type)
SELECT v.name, v.slug, (SELECT id FROM public.categories WHERE slug = 'experience' AND parent_id IS NULL), 'experience'
FROM (VALUES
  ('Dance Floor', 'dance-floor'),
  ('Trivia Night', 'trivia-night'),
  ('Karaoke Night', 'karaoke-night'),
  ('Sports Viewing', 'sports-viewing'),
  ('Live Music', 'live-music'),
  ('Rooftop Dining', 'rooftop-dining')
) AS v(name, slug);

-- 13. Insert new Beverage items
INSERT INTO public.categories (name, slug, parent_id, category_type)
SELECT v.name, v.slug, (SELECT id FROM public.categories WHERE slug = 'beverage' AND parent_id IS NULL), 'beverage'
FROM (VALUES
  ('Craft Beer', 'craft-beer'),
  ('Natural Wine', 'natural-wine')
) AS v(name, slug);
