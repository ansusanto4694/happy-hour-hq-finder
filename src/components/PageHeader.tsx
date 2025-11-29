import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { AuthButton } from '@/components/AuthButton';
import { SearchBar } from '@/components/SearchBar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';

interface PageHeaderProps {
  showSearchBar?: boolean;
  searchBarVariant?: 'hero' | 'results';
  onLogoClick?: () => void;
  transparent?: boolean;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  showSearchBar = false,
  searchBarVariant = 'hero',
  onLogoClick,
  transparent = false,
}) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleLogoClick = () => {
    if (onLogoClick) {
      onLogoClick();
    } else {
      navigate('/');
    }
  };

  const baseClasses = transparent
    ? 'relative top-4 left-4 right-4 md:top-6 md:left-6 md:right-6 z-20'
    : 'backdrop-blur-md border-b border-white/20 fixed top-0 left-0 right-0 z-50';

  const containerClasses = transparent
    ? 'flex justify-between items-center px-4 md:px-6'
    : 'w-full px-8 py-1 flex items-center justify-between';

  return (
    <>
      <div className={baseClasses}>
        <div className={containerClasses}>
          {transparent ? (
            <Link 
              to="/" 
              className="text-xl sm:text-2xl md:text-3xl font-bold text-white hover:text-yellow-200 transition-colors"
            >
              SipMunchYap
            </Link>
          ) : (
            <img 
              src="/lovable-uploads/f30134b8-b54d-491a-b6bc-fc7a20199dd2.png" 
              alt="SipMunchYap Logo" 
              className="h-16 md:h-24 lg:h-32 w-auto cursor-pointer"
              onClick={handleLogoClick}
            />
          )}
          
          {/* Desktop: Show full search bar */}
          {showSearchBar && !isMobile && (
            <div className="flex-1 mx-8">
              <SearchBar variant={searchBarVariant} />
            </div>
          )}
          
          <nav className="flex items-center space-x-2 md:space-x-4 lg:space-x-6">
            {/* Mobile: Show search button instead of full bar */}
            {showSearchBar && isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSearchOpen(true)}
                className="text-white/90 hover:text-white hover:bg-white/10"
                aria-label="Open search"
              >
                <Search className="w-5 h-5" />
              </Button>
            )}
            
            <Link 
              to="/happy-hour/new-york-ny" 
              className="text-white/90 hover:text-white transition-colors text-xs md:text-sm lg:text-base font-medium hidden sm:block"
            >
              NYC Happy Hours
            </Link>
            <Link 
              to="/about" 
              className="text-white/90 hover:text-white transition-colors text-xs md:text-sm lg:text-base font-medium hidden sm:block"
            >
              About
            </Link>
            <Link 
              to="/contact" 
              className="text-white/90 hover:text-white transition-colors text-xs md:text-sm lg:text-base font-medium hidden sm:block"
            >
              Contact
            </Link>
            <AuthButton />
          </nav>
        </div>
      </div>

      {/* Mobile Search Sheet */}
      {showSearchBar && isMobile && (
        <Sheet open={isSearchOpen} onOpenChange={setIsSearchOpen}>
          <SheetContent side="top" className="h-auto max-h-[90vh] overflow-y-auto">
            <SheetHeader className="mb-6">
              <SheetTitle>Search Happy Hours</SheetTitle>
            </SheetHeader>
            <SearchBar variant={searchBarVariant} />
          </SheetContent>
        </Sheet>
      )}
    </>
  );
};
