import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { Star, Pencil, Trash2, ExternalLink, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
  review_text: string;
  status: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  merchant_id: number;
  merchant: {
    restaurant_name: string;
    city: string;
    state: string;
    logo_url: string | null;
  } | null;
  ratings: Array<{ dimension: string; rating: number }>;
}

export const MyReviews: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['my-reviews', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('merchant_reviews')
        .select(`
          id,
          review_text,
          status,
          created_at,
          updated_at,
          published_at,
          merchant_id,
          merchant:Merchant(restaurant_name, city, state, logo_url),
          ratings:merchant_review_ratings(dimension, rating)
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as unknown as ReviewWithMerchant[];
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
      queryClient.invalidateQueries({ queryKey: ['draft-count'] });
      toast({
        title: 'Review deleted',
        description: 'Your review has been removed',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete review',
        variant: 'destructive',
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  // Separate drafts from published reviews
  const drafts = reviews?.filter(r => r.status === 'draft') || [];
  const published = reviews?.filter(r => r.status === 'published') || [];

  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">You haven't written any reviews yet</p>
        <Button asChild>
          <Link to="/results">Find Places to Review</Link>
        </Button>
      </div>
    );
  }

  const getAverageRating = (ratings: Array<{ dimension: string; rating: number }>) => {
    if (!ratings || ratings.length === 0) return null;
    const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
    return (sum / ratings.length).toFixed(1);
  };

  const isStale = (updatedAt: string) => {
    const daysOld = (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24);
    return daysOld > 7;
  };

  const ReviewCard = ({ review, isDraft }: { review: ReviewWithMerchant; isDraft: boolean }) => {
    const avgRating = getAverageRating(review.ratings);
    const stale = isDraft && isStale(review.updated_at);

    return (
      <Card className={isDraft ? 'border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20' : ''}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${review.merchant?.logo_url ? 'bg-white' : 'bg-gradient-to-br from-orange-100 to-amber-100'} border border-border rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0`}>
                {review.merchant?.logo_url ? (
                  <img
                    src={review.merchant.logo_url}
                    alt={review.merchant?.restaurant_name || 'Restaurant'}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-sm font-bold text-muted-foreground">
                    {review.merchant?.restaurant_name?.charAt(0) || '?'}
                  </span>
                )}
              </div>
              <div>
                <CardTitle className="text-base">
                  <Link 
                    to={`/restaurant/${review.merchant_id}`}
                    className="hover:underline"
                  >
                    {review.merchant?.restaurant_name || 'Unknown Restaurant'}
                  </Link>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {review.merchant?.city}, {review.merchant?.state}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isDraft ? (
                <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900 dark:text-amber-200 dark:border-amber-700">
                  Draft
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-200 dark:border-green-700">
                  Published
                </Badge>
              )}
              {avgRating && (
                <div className="flex items-center gap-1 text-sm">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span>{avgRating}</span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {stale && (
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm mb-3 p-2 bg-amber-100/50 dark:bg-amber-900/30 rounded">
              <AlertCircle className="h-4 w-4" />
              <span>This draft is over a week old. Consider finishing or removing it.</span>
            </div>
          )}
          
          {review.review_text ? (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {review.review_text}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground italic mb-3">
              No review text yet
            </p>
          )}
          
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {isDraft ? (
                <>Last edited {formatDistanceToNow(new Date(review.updated_at), { addSuffix: true })}</>
              ) : (
                <>Published {format(new Date(review.published_at!), 'MMM d, yyyy')}</>
              )}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link to={`/restaurant/${review.merchant_id}`}>
                  <ExternalLink className="h-4 w-4 mr-1" />
                  View
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to={`/restaurant/${review.merchant_id}/review`}>
                  <Pencil className="h-4 w-4 mr-1" />
                  {isDraft ? 'Continue' : 'Edit'}
                </Link>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete {isDraft ? 'draft' : 'review'}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your 
                      {isDraft ? ' draft' : ' review'} for {review.merchant?.restaurant_name}.
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
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Drafts Section */}
      {drafts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Drafts in Progress</h3>
            <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
              {drafts.length}
            </Badge>
          </div>
          <div className="space-y-4">
            {drafts.map((review) => (
              <ReviewCard key={review.id} review={review} isDraft={true} />
            ))}
          </div>
        </div>
      )}

      {/* Published Reviews Section */}
      {published.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Published Reviews</h3>
          <div className="space-y-4">
            {published.map((review) => (
              <ReviewCard key={review.id} review={review} isDraft={false} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
