
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Flag, ArrowLeft, Share } from 'lucide-react';
import { AuthButton } from '@/components/AuthButton';
import { ReportIssueModal } from '@/components/ReportIssueModal';
import { SearchBar } from '@/components/SearchBar';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileSearchBar } from '@/components/MobileSearchBar';
import { useToast } from '@/hooks/use-toast';

interface RestaurantHeaderProps {
  merchantId?: number;
  merchantName?: string;
}

export const RestaurantHeader: React.FC<RestaurantHeaderProps> = ({ merchantId, merchantName }) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isScrolled, setIsScrolled] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    if (!isMobile) return;
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile]);
  
  const handleGoHome = () => {
    navigate('/');
  };
  
  const handleBack = () => {
    navigate('/results');
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

  if (isMobile) {
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
  }

  return (
    <div className="bg-white/10 backdrop-blur-sm border-b border-white/20">
      <div className="w-full px-8 py-1">
        <div className="flex items-center justify-between">
          <img 
            src="/lovable-uploads/f30134b8-b54d-491a-b6bc-fc7a20199dd2.png" 
            alt="SipMunchYap Logo" 
            className="h-24 md:h-32 w-auto cursor-pointer"
            onClick={handleGoHome}
          />
          
          {/* Search bar in header */}
          <div className="flex-1 mx-8">
            <SearchBar variant="results" />
          </div>
          
          <nav className="flex items-center space-x-4">
            <button 
              onClick={() => navigate('/about')}
              className="text-white/90 hover:text-white transition-colors text-sm font-medium"
            >
              About
            </button>
            <button 
              onClick={() => navigate('/contact')}
              className="text-white/90 hover:text-white transition-colors text-sm font-medium"
            >
              Contact
            </button>
            {merchantId && merchantName && (
              <ReportIssueModal
                merchantId={merchantId}
                merchantName={merchantName}
                trigger={
                  <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                    <Flag className="w-4 h-4" />
                  </Button>
                }
              />
            )}
            <AuthButton />
          </nav>
        </div>
      </div>
    </div>
  );
};
