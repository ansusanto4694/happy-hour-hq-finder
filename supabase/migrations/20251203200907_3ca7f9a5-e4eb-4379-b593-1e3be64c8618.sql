-- Create merchant_reviews table
CREATE TABLE public.merchant_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  merchant_id INTEGER NOT NULL REFERENCES public."Merchant"(id) ON DELETE CASCADE,
  review_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, merchant_id)
);

-- Create merchant_review_ratings table
CREATE TABLE public.merchant_review_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES public.merchant_reviews(id) ON DELETE CASCADE,
  dimension TEXT NOT NULL CHECK (dimension IN ('happy_hour_value', 'food', 'ambience')),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(review_id, dimension)
);

-- Create merchant_review_media table
CREATE TABLE public.merchant_review_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES public.merchant_reviews(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  storage_path TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.merchant_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_review_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_review_media ENABLE ROW LEVEL SECURITY;

-- RLS policies for merchant_reviews
CREATE POLICY "Anyone can view published reviews"
  ON public.merchant_reviews FOR SELECT
  USING (status = 'published');

CREATE POLICY "Users can view their own reviews"
  ON public.merchant_reviews FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reviews"
  ON public.merchant_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
  ON public.merchant_reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
  ON public.merchant_reviews FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all reviews"
  ON public.merchant_reviews FOR SELECT
  USING (is_admin());

-- RLS policies for merchant_review_ratings
CREATE POLICY "Anyone can view ratings for published reviews"
  ON public.merchant_review_ratings FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.merchant_reviews 
    WHERE id = review_id AND status = 'published'
  ));

CREATE POLICY "Users can view their own ratings"
  ON public.merchant_review_ratings FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.merchant_reviews 
    WHERE id = review_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can manage ratings for their own reviews"
  ON public.merchant_review_ratings FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.merchant_reviews 
    WHERE id = review_id AND user_id = auth.uid()
  ));

-- RLS policies for merchant_review_media
CREATE POLICY "Anyone can view media for published reviews"
  ON public.merchant_review_media FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.merchant_reviews 
    WHERE id = review_id AND status = 'published'
  ));

CREATE POLICY "Users can view their own media"
  ON public.merchant_review_media FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.merchant_reviews 
    WHERE id = review_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can manage media for their own reviews"
  ON public.merchant_review_media FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.merchant_reviews 
    WHERE id = review_id AND user_id = auth.uid()
  ));

-- Create storage bucket for review media
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('review-media', 'review-media', true, 52428800);

-- Storage policies
CREATE POLICY "Anyone can view review media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'review-media');

CREATE POLICY "Authenticated users can upload review media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'review-media' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own review media"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'review-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own review media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'review-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Trigger for updated_at
CREATE TRIGGER update_merchant_reviews_updated_at
  BEFORE UPDATE ON public.merchant_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();