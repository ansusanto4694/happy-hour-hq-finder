
-- Create categories table with hierarchical structure
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  parent_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create junction table for merchant-category relationships
CREATE TABLE public.merchant_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id INTEGER NOT NULL REFERENCES public."Merchant"(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(merchant_id, category_id)
);

-- Create indexes for better performance
CREATE INDEX idx_categories_parent_id ON public.categories(parent_id);
CREATE INDEX idx_categories_slug ON public.categories(slug);
CREATE INDEX idx_merchant_categories_merchant_id ON public.merchant_categories(merchant_id);
CREATE INDEX idx_merchant_categories_category_id ON public.merchant_categories(category_id);

-- Insert some initial categories
INSERT INTO public.categories (name, slug, description) VALUES
  ('Restaurant', 'restaurant', 'Food establishments that serve meals'),
  ('Bar', 'bar', 'Establishments primarily serving alcoholic beverages'),
  ('Pub', 'pub', 'Traditional public houses');

-- Insert cuisine subcategories for restaurants
INSERT INTO public.categories (name, slug, parent_id, description) 
SELECT 'Japanese', 'japanese', id, 'Japanese cuisine restaurants'
FROM public.categories WHERE slug = 'restaurant';

INSERT INTO public.categories (name, slug, parent_id, description) 
SELECT 'Mexican', 'mexican', id, 'Mexican cuisine restaurants'
FROM public.categories WHERE slug = 'restaurant';

INSERT INTO public.categories (name, slug, parent_id, description) 
SELECT 'Mediterranean', 'mediterranean', id, 'Mediterranean cuisine restaurants'
FROM public.categories WHERE slug = 'restaurant';

INSERT INTO public.categories (name, slug, parent_id, description) 
SELECT 'Italian', 'italian', id, 'Italian cuisine restaurants'
FROM public.categories WHERE slug = 'restaurant';

INSERT INTO public.categories (name, slug, parent_id, description) 
SELECT 'American', 'american', id, 'American cuisine restaurants'
FROM public.categories WHERE slug = 'restaurant';

-- Insert bar subcategories
INSERT INTO public.categories (name, slug, parent_id, description) 
SELECT 'Sports Bar', 'sports-bar', id, 'Bars with sports viewing and atmosphere'
FROM public.categories WHERE slug = 'bar';

INSERT INTO public.categories (name, slug, parent_id, description) 
SELECT 'Cocktail Bar', 'cocktail-bar', id, 'Bars specializing in craft cocktails'
FROM public.categories WHERE slug = 'bar';

INSERT INTO public.categories (name, slug, parent_id, description) 
SELECT 'Wine Bar', 'wine-bar', id, 'Bars specializing in wine'
FROM public.categories WHERE slug = 'bar';
