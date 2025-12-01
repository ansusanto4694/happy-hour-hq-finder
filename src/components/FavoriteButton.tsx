import { useState } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/hooks/useAuth';
import { useAnalytics } from '@/hooks/useAnalytics';
import { AuthRequiredModal } from '@/components/AuthRequiredModal';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  merchantId: number;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export const FavoriteButton = ({ 
  merchantId, 
  variant = 'ghost', 
  size = 'icon',
  className 
}: FavoriteButtonProps) => {
  const { user } = useAuth();
  const { isFavorited, toggleFavorite } = useFavorites(user?.id);
  const { track } = useAnalytics();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const favorited = isFavorited(merchantId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      // Track auth-required action attempt
      track({
        eventType: 'conversion',
        eventCategory: 'authentication',
        eventAction: 'auth_required_action_attempted',
        eventLabel: 'favorite_restaurant',
        merchantId,
      });
      
      setShowAuthModal(true);
      return;
    }
    
    // Track favorite toggle for logged-in users
    track({
      eventType: 'interaction',
      eventCategory: 'merchant_interaction',
      eventAction: favorited ? 'unfavorite_restaurant' : 'favorite_restaurant',
      merchantId,
    });
    
    toggleFavorite(merchantId);
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleClick}
        className={cn(
          'transition-all duration-200',
          favorited && 'text-red-500 hover:text-red-600',
          className
        )}
        aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
      >
        <Heart
          className={cn(
            'h-5 w-5',
            favorited && 'fill-current'
          )}
        />
      </Button>

      <AuthRequiredModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        action="save favorites"
        merchantId={merchantId}
      />
    </>
  );
};
