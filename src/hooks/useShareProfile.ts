import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ShareProfileOptions {
  merchantName?: string;
  utmSource?: string;
  utmMedium?: string;
}

/**
 * Hook for sharing merchant profile links.
 * Uses native Web Share API on supported devices (mobile),
 * falls back to clipboard copy. Appends UTM parameters for tracking.
 */
export const useShareProfile = ({
  merchantName,
  utmSource = 'share',
  utmMedium = 'profile',
}: ShareProfileOptions = {}) => {
  const { toast } = useToast();

  const buildShareUrl = useCallback(() => {
    // Route through the og-meta proxy so bots/crawlers see correct OG tags
    const proxyBase = 'https://gohcqazhofdhkghfxfok.supabase.co/functions/v1/og-meta';
    const currentPath = window.location.pathname;
    const proxyUrl = new URL(proxyBase);
    proxyUrl.searchParams.set('path', currentPath);
    proxyUrl.searchParams.set('utm_source', utmSource);
    proxyUrl.searchParams.set('utm_medium', utmMedium);
    return proxyUrl.toString();
  }, [utmSource, utmMedium]);

  const handleShare = useCallback(async () => {
    const shareUrl = buildShareUrl();
    const shareTitle = merchantName
      ? `${merchantName} – Happy Hour on SipMunchYap`
      : 'Check out this spot on SipMunchYap';

    // Try native Web Share API first (mostly mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: `Check out ${merchantName || 'this restaurant'}'s happy hour details!`,
          url: shareUrl,
        });
        // User completed or cancelled native share – no toast needed
        return;
      } catch (err) {
        // User cancelled share or API failed – fall through to clipboard
        if ((err as DOMException)?.name === 'AbortError') {
          return; // User intentionally cancelled
        }
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: 'Link copied!',
        description: 'Restaurant profile link has been copied to your clipboard.',
      });
    } catch {
      toast({
        title: 'Copy failed',
        description: 'Unable to copy link. Please try again.',
        variant: 'destructive',
      });
    }
  }, [buildShareUrl, merchantName, toast]);

  return { handleShare, buildShareUrl };
};
