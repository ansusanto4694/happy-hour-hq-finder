import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, Edit, Trash2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ReviewWithMerchant {
  id: string;
  merchant_id: number;
  review_text: string;
  status: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  merchant: {
    restaurant_name: string;
    logo_url: string | null;
    city: string;
    state: string;
  } | null;
  ratings: {
    dimension: string;
    rating: number;
  }[];
}

export const MyReviews = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['my-reviews', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: reviewsData, error: reviewsError } = await supabase
        .from('merchant_reviews')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (reviewsError) throw reviewsError;
      if (!reviewsData || reviewsData.length === 0) return [];

      // Fetch merchant details and ratings for each review
      const reviewsWithDetails = await Promise.all(
        reviewsData.map(async (review) => {
          const [merchantResult, ratingsResult] = await Promise.all([
            supabase
              .from('Merchant')
              .select('restaurant_name, logo_url, city, state')
              .eq('id', review.merchant_id)
              .maybeSingle(),
            supabase
              .from('merchant_review_ratings')
              .select('dimension, rating')
              .eq('review_id', review.id)
          ]);

          return {
            ...review,
            merchant: merchantResult.data,
            ratings: ratingsResult.data || []
          } as ReviewWithMerchant;
        })
      );

      return reviewsWithDetails;
    },
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      const { error } = await supabase
        .from('merchant_reviews')
        .delete()
        .eq('id', reviewId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-reviews'] });
      toast.success('Review deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete review');
    },
  });

  const getAverageRating = (ratings: { dimension: string; rating: number }[]) => {
    if (ratings.length === 0) return null;
    const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
    return (sum / ratings.length).toFixed(1);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <Skeleton className="w-16 h-16 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Star className="w-16 h-16 text-muted-foreground mb-4" />
        <p className="text-center text-muted-foreground mb-4">
          You haven't written any reviews yet
        </p>
        <Button asChild>
          <Link to="/results">Find places to review</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <Card key={review.id}>
          <CardContent className="p-4">
            <div className="flex gap-4">
              {/* Merchant Logo */}
              <div className={`w-16 h-16 ${review.merchant?.logo_url ? 'bg-white' : 'bg-gradient-to-br from-orange-100 to-amber-100'} border border-border rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0`}>
                {review.merchant?.logo_url ? (
                  <img
                    src={review.merchant.logo_url}
                    alt={review.merchant?.restaurant_name || 'Restaurant'}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-2xl font-bold text-muted-foreground">
                    {review.merchant?.restaurant_name?.charAt(0) || '?'}
                  </span>
                )}
              </div>

              {/* Review Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link
                      to={`/restaurant/${review.merchant_id}`}
                      className="font-semibold hover:underline flex items-center gap-1"
                    >
                      {review.merchant?.restaurant_name || 'Unknown Restaurant'}
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {review.merchant?.city}, {review.merchant?.state}
                    </p>
                  </div>
                  <Badge variant={review.status === 'published' ? 'default' : 'secondary'}>
                    {review.status === 'published' ? 'Published' : 'Draft'}
                  </Badge>
                </div>

                {/* Rating */}
                {review.ratings.length > 0 && (
                  <div className="flex items-center gap-1 mt-2">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{getAverageRating(review.ratings)}</span>
                    <span className="text-sm text-muted-foreground">
                      ({review.ratings.length} ratings)
                    </span>
                  </div>
                )}

                {/* Review Text Preview */}
                <p className="text-sm mt-2 line-clamp-2">{review.review_text}</p>

                {/* Date and Actions */}
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-muted-foreground">
                    {review.status === 'published' && review.published_at
                      ? `Published ${new Date(review.published_at).toLocaleDateString()}`
                      : `Last edited ${new Date(review.updated_at).toLocaleDateString()}`}
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/restaurant/${review.merchant_id}/review`}>
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Link>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Review</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this review? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(review.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
