import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthButton } from '@/components/AuthButton';
import { SearchBar } from '@/components/SearchBar';

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

  const handleLogoClick = () => {
    if (onLogoClick) {
      onLogoClick();
    } else {
      navigate('/');
    }
  };

  const baseClasses = transparent
    ? 'relative top-4 left-4 right-4 md:top-6 md:left-6 md:right-6 z-20'
    : 'bg-black/20 backdrop-blur-md border-b border-white/20 fixed top-0 left-0 right-0 z-50';

  const containerClasses = transparent
    ? 'flex justify-between items-center px-4 md:px-6'
    : 'w-full px-8 py-1 flex items-center justify-between';

  return (
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
            className="h-24 md:h-32 w-auto cursor-pointer"
            onClick={handleLogoClick}
          />
        )}
        
        {showSearchBar && (
          <div className="flex-1 mx-8">
            <SearchBar variant={searchBarVariant} />
          </div>
        )}
        
        <nav className="flex items-center space-x-4 md:space-x-6">
          <Link 
            to="/happy-hour/new-york-ny" 
            className="text-white/90 hover:text-white transition-colors text-sm md:text-base font-medium"
          >
            NYC Happy Hours
          </Link>
          <Link 
            to="/about" 
            className="text-white/90 hover:text-white transition-colors text-sm md:text-base font-medium"
          >
            About
          </Link>
          <Link 
            to="/contact" 
            className="text-white/90 hover:text-white transition-colors text-sm md:text-base font-medium"
          >
            Contact
          </Link>
          <AuthButton />
        </nav>
      </div>
    </div>
  );
};
