import React, { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Save, Send, Loader2, Check, CloudOff, X } from 'lucide-react';
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
import { PageHeader } from '@/components/PageHeader';
import { Footer } from '@/components/Footer';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const AutoSaveIndicator: React.FC<{ status: string }> = ({ status }) => {
  if (status === 'idle') return null;
  
  return (
    <div className={cn(
      "flex items-center gap-2 text-sm transition-all duration-300",
      status === 'saving' && "text-muted-foreground",
      status === 'saved' && "text-green-600",
      status === 'pending' && "text-amber-600",
      status === 'error' && "text-destructive"
    )}>
      {status === 'saving' && (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Saving...</span>
        </>
      )}
      {status === 'saved' && (
        <>
          <Check className="h-3 w-3" />
          <span>Draft saved</span>
        </>
      )}
      {status === 'pending' && (
        <span className="text-muted-foreground">Unsaved changes</span>
      )}
      {status === 'error' && (
        <>
          <CloudOff className="h-3 w-3" />
          <span>Failed to save</span>
        </>
      )}
    </div>
  );
};

const WriteReview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const isMobile = useIsMobile();
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
    autoSaveStatus,
    ratings,
    setRatings,
    reviewText,
    setReviewText,
    mediaFiles,
    setMediaFiles,
    existingMedia,
    deleteMedia,
    deletingMediaId,
    saveDraft,
    submitReview,
  } = useReview(merchantId);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate(`/auth?redirect=/restaurant/${merchantId}/review`);
    }
  }, [authLoading, user, merchantId, navigate]);

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
      
      <div className="min-h-screen relative bg-gradient-to-br from-orange-400 via-amber-500 to-yellow-500">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          {!isMobile && <PageHeader showSearchBar={true} searchBarVariant="results" />}
          <div className={`max-w-2xl mx-auto px-4 ${isMobile ? 'py-8' : 'pt-32 pb-8'}`}>
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <Link
                to={`/restaurant/${merchantId}`}
                className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Restaurant
              </Link>
              <AutoSaveIndicator status={autoSaveStatus} />
            </div>
            <h1 className="text-3xl font-bold">Write a Review</h1>
          </div>

          {/* Merchant Info */}
          <Card className="mb-8">
          <CardContent className="flex items-center gap-4 py-4">
            <div className={`w-16 h-16 ${merchant.logo_url ? 'bg-white' : 'bg-gradient-to-br from-orange-100 to-amber-100'} border border-border rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0`}>
              {merchant.logo_url ? (
                <img
                  src={merchant.logo_url}
                  alt={merchant.restaurant_name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-2xl font-bold text-muted-foreground">
                  {merchant.restaurant_name.charAt(0)}
                </span>
              )}
            </div>
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
                    <div key={media.id} className="relative aspect-square rounded-lg overflow-hidden bg-muted group">
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
                      <button
                        onClick={() => deleteMedia(media.id, media.storage_path)}
                        disabled={deletingMediaId === media.id}
                        className="absolute top-1 right-1 p-1 bg-destructive/90 text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive disabled:opacity-50"
                        title="Delete media"
                      >
                        {deletingMediaId === media.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <X className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Auto-save notice */}
          <p className="text-sm text-muted-foreground text-center mb-6">
            Your changes are automatically saved as a draft
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
          <Footer />
        </div>
      </div>
    </>
  );
};

export default WriteReview;
