
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Flag, ArrowLeft, Share } from 'lucide-react';
import { ReportIssueModal } from '@/components/ReportIssueModal';
import { useToast } from '@/hooks/use-toast';
import { FavoriteButton } from '@/components/FavoriteButton';

interface RestaurantHeaderProps {
  merchantId?: number;
  merchantName?: string;
}

// Mobile-only header for restaurant profile pages
export const RestaurantHeader: React.FC<RestaurantHeaderProps> = ({ merchantId, merchantName }) => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const handleBack = () => {
    // Use browser history to preserve URL parameters and enable scroll restoration
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/results');
    }
  };
  
  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "Restaurant profile link has been copied to your clipboard.",
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Unable to copy link. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className={`sticky top-0 z-50 bg-white shadow-sm border-b transition-all duration-300 ${isScrolled ? 'py-2' : 'py-3'}`}>
      <div className="w-full px-4">
        <div className="flex items-center justify-between gap-3">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleBack}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          {isScrolled && merchantName && (
            <h1 className="flex-1 text-base font-semibold truncate text-center animate-fade-in">
              {merchantName}
            </h1>
          )}
          
          {!isScrolled && (
            <div className="flex-1" />
          )}
          
          <div className="flex items-center gap-2">
            {merchantId && (
              <FavoriteButton 
                merchantId={merchantId}
                variant="ghost"
                size="sm"
                className="p-2"
              />
            )}
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleShare}
              className="p-2"
              aria-label="Share restaurant profile"
            >
              <Share className="w-5 h-5" />
            </Button>
            
            {merchantId && merchantName && (
              <ReportIssueModal
                merchantId={merchantId}
                merchantName={merchantName}
                trigger={
                  <Button variant="ghost" size="sm" className="p-2">
                    <Flag className="w-4 h-4" />
                  </Button>
                }
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
