import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Star, MessageSquare, PenLine } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface Review {
  id: string;
  review_text: string;
  published_at: string;
  user_id: string;
  profile: {
    first_name: string;
    last_name: string | null;
  } | null;
  ratings: Array<{ dimension: string; rating: number }>;
  media: Array<{ id: string; storage_path: string; media_type: string }>;
}

interface MerchantReviewsProps {
  merchantId: number;
  merchantName: string;
}

const SUPABASE_URL = 'https://gohcqazhofdhkghfxfok.supabase.co';

export const MerchantReviews: React.FC<MerchantReviewsProps> = ({ merchantId, merchantName }) => {
  const { user } = useAuth();

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['merchant-reviews', merchantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('merchant_reviews')
        .select(`
          id,
          review_text,
          published_at,
          user_id,
          profile:profiles(first_name, last_name),
          ratings:merchant_review_ratings(dimension, rating),
          media:merchant_review_media(id, storage_path, media_type)
        `)
        .eq('merchant_id', merchantId)
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (error) throw error;
      return data as unknown as Review[];
    },
  });

  const getAverageRating = (ratings: Array<{ dimension: string; rating: number }>) => {
    if (!ratings || ratings.length === 0) return null;
    const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
    return (sum / ratings.length).toFixed(1);
  };

  const getInitials = (firstName: string, lastName: string | null) => {
    const first = firstName?.charAt(0)?.toUpperCase() || '';
    const last = lastName?.charAt(0)?.toUpperCase() || '';
    return first + last || '?';
  };

  const getDimensionLabel = (dimension: string) => {
    const labels: Record<string, string> = {
      happy_hour_value: 'Happy Hour Value',
      food: 'Food',
      ambience: 'Ambience',
    };
    return labels[dimension] || dimension;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-9 w-32" />
        </div>
        {[1, 2].map((i) => (
          <div key={i} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="h-20 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-amber-500" />
          <h2 className="text-xl font-semibold">Reviews</h2>
          {reviews && reviews.length > 0 && (
            <span className="text-muted-foreground">({reviews.length})</span>
          )}
        </div>
        <Button asChild size="sm">
          <Link to={`/restaurant/${merchantId}/review`}>
            <PenLine className="h-4 w-4 mr-2" />
            Write a Review
          </Link>
        </Button>
      </div>

      {!reviews || reviews.length === 0 ? (
        <div className="text-center py-8 border border-dashed rounded-lg">
          <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground mb-4">
            No reviews yet for {merchantName}
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Be the first to share your experience!
          </p>
          <Button asChild>
            <Link to={`/restaurant/${merchantId}/review`}>
              <PenLine className="h-4 w-4 mr-2" />
              Write the First Review
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => {
            const avgRating = getAverageRating(review.ratings);
            
            return (
              <div
                key={review.id}
                className="border rounded-lg p-4 space-y-4"
              >
                {/* Header: Avatar, Name, Date, Rating */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-amber-100 text-amber-700 font-medium">
                        {getInitials(
                          review.profile?.first_name || '',
                          review.profile?.last_name
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {review.profile?.first_name || 'Anonymous'}
                        {review.profile?.last_name ? ` ${review.profile.last_name.charAt(0)}.` : ''}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(review.published_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  {avgRating && (
                    <div className="flex items-center gap-1 text-sm font-medium">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span>{avgRating}</span>
                    </div>
                  )}
                </div>

                {/* Dimension Ratings */}
                {review.ratings && review.ratings.length > 0 && (
                  <div className="flex flex-wrap gap-3">
                    {review.ratings.map((r) => (
                      <div
                        key={r.dimension}
                        className="flex items-center gap-1.5 text-sm text-muted-foreground"
                      >
                        <span>{getDimensionLabel(r.dimension)}:</span>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-3 w-3 ${
                                star <= r.rating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-muted-foreground/30'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Review Text */}
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {review.review_text}
                </p>

                {/* Media */}
                {review.media && review.media.length > 0 && (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {review.media.map((m) => (
                      <div
                        key={m.id}
                        className="aspect-square rounded-lg overflow-hidden bg-muted"
                      >
                        {m.media_type === 'image' ? (
                          <img
                            src={`${SUPABASE_URL}/storage/v1/object/public/review-media/${m.storage_path}`}
                            alt="Review photo"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <video
                            src={`${SUPABASE_URL}/storage/v1/object/public/review-media/${m.storage_path}`}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
