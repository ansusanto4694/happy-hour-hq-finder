import React, { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Save, Send, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useReview } from '@/hooks/useReview';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { RatingDimensionCard } from '@/components/reviews/RatingDimensionCard';
import { ReviewTextEditor } from '@/components/reviews/ReviewTextEditor';
import { ReviewMediaUpload } from '@/components/reviews/ReviewMediaUpload';
import { SEOHead } from '@/components/SEOHead';

const WriteReview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const merchantId = parseInt(id || '0', 10);

  // Fetch merchant data
  const { data: merchant, isLoading: merchantLoading } = useQuery({
    queryKey: ['merchant', merchantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Merchant')
        .select('id, restaurant_name, street_address, city, state, zip_code, logo_url')
        .eq('id', merchantId)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: merchantId > 0,
  });

  const {
    isLoading: reviewLoading,
    isSaving,
    ratings,
    setRatings,
    reviewText,
    setReviewText,
    mediaFiles,
    setMediaFiles,
    existingMedia,
    saveDraft,
    submitReview,
  } = useReview(merchantId);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate(`/auth?redirect=/restaurant/${merchantId}/review`);
    }
  }, [authLoading, user, merchantId, navigate]);

  // Auto-save draft on page unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (reviewText.trim() || Object.values(ratings).some(r => r !== null)) {
        saveDraft();
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [reviewText, ratings, saveDraft]);

  const isLoading = authLoading || merchantLoading || reviewLoading;
  const canSubmit = reviewText.trim().length > 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-8" />
          <Skeleton className="h-24 w-full mb-6" />
          <Skeleton className="h-32 w-full mb-4" />
          <Skeleton className="h-32 w-full mb-4" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Restaurant not found</h1>
          <Button asChild>
            <Link to="/">Go Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title={`Write a Review for ${merchant.restaurant_name}`}
        description={`Share your experience at ${merchant.restaurant_name}`}
        noIndex
      />
      
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              to={`/restaurant/${merchantId}`}
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Restaurant
            </Link>
            <h1 className="text-3xl font-bold">Write a Review</h1>
          </div>

          {/* Merchant Info */}
          <Card className="mb-8">
            <CardContent className="flex items-center gap-4 py-4">
              {merchant.logo_url ? (
                <img
                  src={merchant.logo_url}
                  alt={merchant.restaurant_name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                  <span className="text-2xl font-bold text-muted-foreground">
                    {merchant.restaurant_name.charAt(0)}
                  </span>
                </div>
              )}
              <div>
                <h2 className="text-lg font-semibold">{merchant.restaurant_name}</h2>
                <p className="text-sm text-muted-foreground">
                  {merchant.street_address}, {merchant.city}, {merchant.state} {merchant.zip_code}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Ratings Section */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Rate Your Experience</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Rate the aspects that matter to you (optional)
            </p>
            <div className="space-y-4">
              <RatingDimensionCard
                title="Happy Hour Value"
                description="How were the happy hour prices and deals?"
                value={ratings.happy_hour_value}
                onChange={(value) => setRatings(prev => ({ ...prev, happy_hour_value: value }))}
                disabled={isSaving}
              />
              <RatingDimensionCard
                title="Food"
                description="How was the quality of the food?"
                value={ratings.food}
                onChange={(value) => setRatings(prev => ({ ...prev, food: value }))}
                disabled={isSaving}
              />
              <RatingDimensionCard
                title="Ambience"
                description="How was the atmosphere and vibe?"
                value={ratings.ambience}
                onChange={(value) => setRatings(prev => ({ ...prev, ambience: value }))}
                disabled={isSaving}
              />
            </div>
          </section>

          <Separator className="my-8" />

          {/* Review Text Section */}
          <section className="mb-8">
            <ReviewTextEditor
              value={reviewText}
              onChange={setReviewText}
              disabled={isSaving}
            />
          </section>

          <Separator className="my-8" />

          {/* Media Upload Section */}
          <section className="mb-8">
            <ReviewMediaUpload
              files={mediaFiles}
              onChange={setMediaFiles}
              disabled={isSaving}
            />
            {existingMedia.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-2">
                  Previously uploaded ({existingMedia.length})
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {existingMedia.map((media) => (
                    <div key={media.id} className="aspect-square rounded-lg overflow-hidden bg-muted">
                      {media.media_type === 'image' ? (
                        <img
                          src={`https://gohcqazhofdhkghfxfok.supabase.co/storage/v1/object/public/review-media/${media.storage_path}`}
                          alt="Review media"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <video
                          src={`https://gohcqazhofdhkghfxfok.supabase.co/storage/v1/object/public/review-media/${media.storage_path}`}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Auto-save notice */}
          <p className="text-sm text-muted-foreground text-center mb-6">
            Your review will be automatically saved as a draft if you navigate away
          </p>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end">
            <Button
              variant="outline"
              onClick={saveDraft}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save as Draft
            </Button>
            <Button
              onClick={submitReview}
              disabled={isSaving || !canSubmit}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Submit Review
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default WriteReview;
