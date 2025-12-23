import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Star, MessageSquare, PenLine, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface Review {
  id: string;
  review_text: string;
  published_at: string;
  user_id: string;
  profile_display_names: {
    first_name: string;
    last_name_initial: string | null;
  } | null;
  ratings: Array<{ dimension: string; rating: number }>;
  media: Array<{ id: string; storage_path: string; media_type: string }>;
}

interface MerchantReviewsProps {
  merchantId: number;
  merchantName: string;
  merchantSlug?: string | null;
}

const SUPABASE_URL = 'https://gohcqazhofdhkghfxfok.supabase.co';

export const MerchantReviews: React.FC<MerchantReviewsProps> = ({ merchantId, merchantName, merchantSlug }) => {
  const { user } = useAuth();
  // Use slug for URLs when available for SEO
  const merchantUrlId = merchantSlug || merchantId;
  const [selectedMedia, setSelectedMedia] = useState<{ media: Array<{ id: string; storage_path: string; media_type: string }>; index: number } | null>(null);

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
          profile_display_names(first_name, last_name_initial),
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

  const getInitials = (firstName: string, lastNameInitial: string | null) => {
    const first = firstName?.charAt(0)?.toUpperCase() || '';
    const last = lastNameInitial?.charAt(0)?.toUpperCase() || '';
    return first + last || '?';
  };

  const getDimensionLabel = (dimension: string) => {
    const labels: Record<string, string> = {
      happy_hour_value: 'Happy Hour Value',
      food: 'Food Quality',
      ambience: 'Ambience',
    };
    return labels[dimension] || dimension;
  };

  const calculateAggregateRatings = (reviews: Review[]) => {
    const dimensions = ['happy_hour_value', 'food', 'ambience'] as const;
    const aggregates: Record<string, { sum: number; count: number }> = {};
    let totalSum = 0;
    let totalCount = 0;
    
    dimensions.forEach(dim => {
      aggregates[dim] = { sum: 0, count: 0 };
    });
    
    reviews?.forEach(review => {
      review.ratings?.forEach(rating => {
        if (aggregates[rating.dimension]) {
          aggregates[rating.dimension].sum += rating.rating;
          aggregates[rating.dimension].count += 1;
          totalSum += rating.rating;
          totalCount += 1;
        }
      });
    });
    
    const dimensionAverages = dimensions.map(dim => ({
      dimension: dim,
      average: aggregates[dim].count > 0 
        ? aggregates[dim].sum / aggregates[dim].count 
        : null,
      count: aggregates[dim].count
    }));

    const overallAverage = totalCount > 0 ? totalSum / totalCount : null;

    return { dimensionAverages, overallAverage };
  };

  const { dimensionAverages: aggregateRatings, overallAverage } = reviews 
    ? calculateAggregateRatings(reviews) 
    : { dimensionAverages: [], overallAverage: null };

  const navigateMedia = (direction: 'prev' | 'next') => {
    if (!selectedMedia) return;
    const newIndex = direction === 'prev' 
      ? (selectedMedia.index - 1 + selectedMedia.media.length) % selectedMedia.media.length
      : (selectedMedia.index + 1) % selectedMedia.media.length;
    setSelectedMedia({ ...selectedMedia, index: newIndex });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') navigateMedia('prev');
    if (e.key === 'ArrowRight') navigateMedia('next');
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
          <Link to={`/restaurant/${merchantUrlId}/review`}>
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
            <Link to={`/restaurant/${merchantUrlId}/review`}>
              <PenLine className="h-4 w-4 mr-2" />
              Write the First Review
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Ratings Summary */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Ratings Overview
              </h3>
              {overallAverage !== null && (
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                  <span className="text-2xl font-bold">{overallAverage.toFixed(1)}</span>
                </div>
              )}
            </div>
            <div className="grid gap-2">
              {aggregateRatings.map(({ dimension, average }) => (
                <div key={dimension} className="flex items-center justify-between">
                  <span className="text-sm">{getDimensionLabel(dimension)}</span>
                  {average !== null ? (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= Math.round(average)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-muted-foreground/30'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium w-8">{average.toFixed(1)}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">No Rating Yet</span>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground pt-2 border-t">
              {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
            </p>
          </div>
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
                          review.profile_display_names?.first_name || '',
                          review.profile_display_names?.last_name_initial
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {review.profile_display_names?.first_name || 'Anonymous'}
                        {review.profile_display_names?.last_name_initial ? ` ${review.profile_display_names.last_name_initial}` : ''}
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
                    {review.media.map((m, idx) => (
                      <button
                        key={m.id}
                        onClick={() => setSelectedMedia({ media: review.media, index: idx })}
                        className="aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
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
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          </div>
        </div>
      )}

      {/* Media Lightbox */}
      <Dialog open={!!selectedMedia} onOpenChange={() => setSelectedMedia(null)}>
        <DialogContent 
          className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none"
          onKeyDown={handleKeyDown}
        >
          <button
            onClick={() => setSelectedMedia(null)}
            className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>

          {selectedMedia && (
            <div className="relative flex items-center justify-center w-full h-[85vh]">
              {/* Navigation arrows for multiple images */}
              {selectedMedia.media.length > 1 && (
                <>
                  <button
                    onClick={() => navigateMedia('prev')}
                    className="absolute left-4 z-50 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={() => navigateMedia('next')}
                    className="absolute right-4 z-50 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}

              {/* Image/Video display */}
              {selectedMedia.media[selectedMedia.index].media_type === 'image' ? (
                <img
                  src={`${SUPABASE_URL}/storage/v1/object/public/review-media/${selectedMedia.media[selectedMedia.index].storage_path}`}
                  alt="Review photo enlarged"
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <video
                  src={`${SUPABASE_URL}/storage/v1/object/public/review-media/${selectedMedia.media[selectedMedia.index].storage_path}`}
                  className="max-w-full max-h-full object-contain"
                  controls
                  autoPlay
                />
              )}

              {/* Image counter */}
              {selectedMedia.media.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/50 text-white text-sm">
                  {selectedMedia.index + 1} / {selectedMedia.media.length}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
