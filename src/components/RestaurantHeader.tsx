
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Flag } from 'lucide-react';
import { AuthButton } from '@/components/AuthButton';
import { ReportIssueModal } from '@/components/ReportIssueModal';
import { SearchBar } from '@/components/SearchBar';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileSearchBar } from '@/components/MobileSearchBar';

interface RestaurantHeaderProps {
  merchantId?: number;
  merchantName?: string;
}

export const RestaurantHeader: React.FC<RestaurantHeaderProps> = ({ merchantId, merchantName }) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const handleGoHome = () => {
    navigate('/');
  };

  if (isMobile) {
    return (
      <div className="bg-white shadow-sm border-b">
        <div className="w-full px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex-1 flex justify-center">
              <div className="w-full max-w-7xl">
                <MobileSearchBar />
              </div>
            </div>
            {merchantId && merchantName && (
              <div className="ml-2">
                <ReportIssueModal
                  merchantId={merchantId}
                  merchantName={merchantName}
                  trigger={
                    <Button variant="outline" size="sm">
                      <Flag className="w-4 h-4" />
                    </Button>
                  }
                />
              </div>
            )}
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
