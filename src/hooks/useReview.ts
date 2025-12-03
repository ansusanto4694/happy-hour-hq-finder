import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { MediaFile } from '@/components/reviews/ReviewMediaUpload';

export interface ReviewRatings {
  happy_hour_value: number | null;
  food: number | null;
  ambience: number | null;
}

export interface ReviewData {
  id?: string;
  merchantId: number;
  ratings: ReviewRatings;
  reviewText: string;
  mediaFiles: MediaFile[];
  status: 'draft' | 'published';
}

export const useReview = (merchantId: number) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [existingReviewId, setExistingReviewId] = useState<string | null>(null);
  const [ratings, setRatings] = useState<ReviewRatings>({
    happy_hour_value: null,
    food: null,
    ambience: null,
  });
  const [reviewText, setReviewText] = useState('');
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [existingMedia, setExistingMedia] = useState<Array<{ id: string; storage_path: string; media_type: string }>>([]);

  // Load existing draft or review
  useEffect(() => {
    const loadExistingReview = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        // Check for existing review (draft or published)
        const { data: review, error: reviewError } = await supabase
          .from('merchant_reviews')
          .select('*')
          .eq('user_id', user.id)
          .eq('merchant_id', merchantId)
          .maybeSingle();

        if (reviewError) throw reviewError;

        if (review) {
          setExistingReviewId(review.id);
          setReviewText(review.review_text || '');

          // Load ratings
          const { data: ratingsData } = await supabase
            .from('merchant_review_ratings')
            .select('*')
            .eq('review_id', review.id);

          if (ratingsData) {
            const loadedRatings: ReviewRatings = {
              happy_hour_value: null,
              food: null,
              ambience: null,
            };
            ratingsData.forEach((r) => {
              if (r.dimension in loadedRatings) {
                loadedRatings[r.dimension as keyof ReviewRatings] = r.rating;
              }
            });
            setRatings(loadedRatings);
          }

          // Load existing media
          const { data: mediaData } = await supabase
            .from('merchant_review_media')
            .select('*')
            .eq('review_id', review.id)
            .order('display_order');

          if (mediaData) {
            setExistingMedia(mediaData);
          }
        }
      } catch (error) {
        console.error('Error loading review:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingReview();
  }, [user, merchantId]);

  const uploadMedia = async (reviewId: string, files: MediaFile[]) => {
    const uploadedMedia: Array<{ storage_path: string; media_type: string; display_order: number }> = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.file.name.split('.').pop();
      const filePath = `${user!.id}/${reviewId}/${Date.now()}-${i}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('review-media')
        .upload(filePath, file.file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        continue;
      }

      uploadedMedia.push({
        storage_path: filePath,
        media_type: file.type,
        display_order: existingMedia.length + i,
      });
    }

    if (uploadedMedia.length > 0) {
      await supabase
        .from('merchant_review_media')
        .insert(uploadedMedia.map(m => ({ ...m, review_id: reviewId })));
    }
  };

  const saveRatings = async (reviewId: string) => {
    // Delete existing ratings first
    await supabase
      .from('merchant_review_ratings')
      .delete()
      .eq('review_id', reviewId);

    // Insert new ratings
    const ratingsToInsert = Object.entries(ratings)
      .filter(([_, value]) => value !== null)
      .map(([dimension, rating]) => ({
        review_id: reviewId,
        dimension,
        rating: rating as number,
      }));

    if (ratingsToInsert.length > 0) {
      await supabase
        .from('merchant_review_ratings')
        .insert(ratingsToInsert);
    }
  };

  const saveReview = useCallback(async (status: 'draft' | 'published') => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to write a review',
        variant: 'destructive',
      });
      return false;
    }

    if (status === 'published' && !reviewText.trim()) {
      toast({
        title: 'Review required',
        description: 'Please write a review before submitting',
        variant: 'destructive',
      });
      return false;
    }

    setIsSaving(true);

    try {
      let reviewId = existingReviewId;

      if (reviewId) {
        // Update existing review
        const { error } = await supabase
          .from('merchant_reviews')
          .update({
            review_text: reviewText,
            status,
            published_at: status === 'published' ? new Date().toISOString() : null,
          })
          .eq('id', reviewId);

        if (error) throw error;
      } else {
        // Create new review
        const { data, error } = await supabase
          .from('merchant_reviews')
          .insert({
            user_id: user.id,
            merchant_id: merchantId,
            review_text: reviewText,
            status,
            published_at: status === 'published' ? new Date().toISOString() : null,
          })
          .select()
          .single();

        if (error) throw error;
        reviewId = data.id;
        setExistingReviewId(reviewId);
      }

      // Save ratings
      await saveRatings(reviewId!);

      // Upload new media files
      if (mediaFiles.length > 0) {
        await uploadMedia(reviewId!, mediaFiles);
        setMediaFiles([]); // Clear uploaded files
      }

      toast({
        title: status === 'published' ? 'Review submitted!' : 'Draft saved',
        description: status === 'published' 
          ? 'Thank you for sharing your experience'
          : 'Your review has been saved as a draft',
      });

      if (status === 'published') {
        navigate(`/restaurant/${merchantId}`);
      }

      return true;
    } catch (error: any) {
      console.error('Error saving review:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save review',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [user, merchantId, reviewText, ratings, mediaFiles, existingReviewId, existingMedia.length, navigate, toast]);

  const saveDraft = useCallback(() => saveReview('draft'), [saveReview]);
  const submitReview = useCallback(() => saveReview('published'), [saveReview]);

  return {
    isLoading,
    isSaving,
    existingReviewId,
    ratings,
    setRatings,
    reviewText,
    setReviewText,
    mediaFiles,
    setMediaFiles,
    existingMedia,
    saveDraft,
    submitReview,
  };
};
