import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface RatingData {
  overallAverage: number | null;
  reviewCount: number;
  source: 'native' | 'google' | null;
  googleRatingUrl?: string | null;
}

export const useMerchantRating = (merchantId: number) => {
  return useQuery({
    queryKey: ['merchant-rating', merchantId],
    queryFn: async (): Promise<RatingData> => {
      // Fetch native reviews and Google rating in parallel
      const [reviewsResult, googleResult] = await Promise.all([
        supabase
          .from('merchant_reviews')
          .select(`
            id,
            ratings:merchant_review_ratings(rating)
          `)
          .eq('merchant_id', merchantId)
          .eq('status', 'published'),
        supabase
          .from('merchant_google_ratings')
          .select('google_rating, google_review_count, google_rating_url, match_confidence')
          .eq('merchant_id', merchantId)
          .maybeSingle(),
      ]);

      if (reviewsResult.error) throw reviewsResult.error;

      const reviews = reviewsResult.data || [];

      // Calculate native rating
      if (reviews.length > 0) {
        let totalSum = 0;
        let totalCount = 0;

        reviews.forEach((review: any) => {
          review.ratings?.forEach((r: { rating: number }) => {
            totalSum += r.rating;
            totalCount += 1;
          });
        });

        if (totalCount > 0) {
          return {
            overallAverage: totalSum / totalCount,
            reviewCount: reviews.length,
            source: 'native',
          };
        }
      }

      // Fallback to Google rating
      const google = googleResult.data;
      if (
        google?.google_rating &&
        google.match_confidence !== 'no_match'
      ) {
        return {
          overallAverage: google.google_rating,
          reviewCount: google.google_review_count || 0,
          source: 'google',
          googleRatingUrl: google.google_rating_url,
        };
      }

      return { overallAverage: null, reviewCount: 0, source: null };
    },
  });
};
