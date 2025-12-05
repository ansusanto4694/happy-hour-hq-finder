import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface RatingData {
  overallAverage: number | null;
  reviewCount: number;
}

export const useMerchantRating = (merchantId: number) => {
  return useQuery({
    queryKey: ['merchant-rating', merchantId],
    queryFn: async (): Promise<RatingData> => {
      const { data: reviews, error } = await supabase
        .from('merchant_reviews')
        .select(`
          id,
          ratings:merchant_review_ratings(rating)
        `)
        .eq('merchant_id', merchantId)
        .eq('status', 'published');

      if (error) throw error;

      if (!reviews || reviews.length === 0) {
        return { overallAverage: null, reviewCount: 0 };
      }

      let totalSum = 0;
      let totalCount = 0;

      reviews.forEach((review: any) => {
        review.ratings?.forEach((r: { rating: number }) => {
          totalSum += r.rating;
          totalCount += 1;
        });
      });

      const overallAverage = totalCount > 0 ? totalSum / totalCount : null;

      return { overallAverage, reviewCount: reviews.length };
    },
  });
};
