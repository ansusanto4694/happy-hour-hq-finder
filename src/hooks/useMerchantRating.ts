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
    queryKey: ['merchant-rating-v2', merchantId],
    queryFn: async (): Promise<RatingData> => {
      const { data: response, error: invokeError } = await supabase.functions.invoke('merchant-api', {
        body: { action: 'ratings', params: { merchantId } },
      });

      if (invokeError) throw invokeError;

      const { reviews, google } = response?.data || { reviews: [], google: null };

      // Extract Google listing URL before any early returns
      const googleRatingUrl = google?.match_confidence !== 'no_match'
        ? google?.google_rating_url ?? null
        : null;

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
            googleRatingUrl,
          };
        }
      }

      // Fallback to Google rating
      if (
        google?.google_rating &&
        google.match_confidence !== 'no_match'
      ) {
        return {
          overallAverage: google.google_rating,
          reviewCount: google.google_review_count || 0,
          source: 'google',
          googleRatingUrl,
        };
      }

      return { overallAverage: null, reviewCount: 0, source: null, googleRatingUrl: null };
    },
  });
};
