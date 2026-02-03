
import React from 'react';
import { Link } from 'react-router-dom';
import { SearchBar } from './SearchBar';
import { AuthButton } from './AuthButton';
import { MobileCarousels } from './MobileCarousels';
import { useAnalytics } from '@/hooks/useAnalytics';

const Hero = () => {
  const { track } = useAnalytics();

  const handleNavClick = async (label: string) => {
    await track({
      eventType: 'click',
      eventCategory: 'navigation',
      eventAction: 'nav_link_click',
      eventLabel: label,
    });
  };

  return (
    <div className="relative overflow-hidden pb-4 md:min-h-screen md:pb-8">
      
      {/* Header with company name and navigation */}
      <div className="absolute top-4 left-4 right-4 md:top-6 md:left-6 md:right-6 z-20 flex justify-between items-center">
        <img 
          src="/lovable-uploads/f30134b8-b54d-491a-b6bc-fc7a20199dd2.png" 
          alt="SipMunchYap Logo" 
          className="h-16 sm:h-20 md:h-32 w-auto"
          fetchPriority="high"
          loading="eager"
          width={128}
          height={128}
        />
        <nav className="flex items-center space-x-4 md:space-x-6">
          <Link 
            to="/about" 
            onClick={() => handleNavClick('about')}
            className="text-white/90 hover:text-white transition-colors text-sm md:text-base font-medium"
          >
            About
          </Link>
          <Link 
            to="/contact" 
            onClick={() => handleNavClick('contact')}
            className="text-white/90 hover:text-white transition-colors text-sm md:text-base font-medium"
          >
            Contact
          </Link>
          <AuthButton />
        </nav>
      </div>
      
      
      {/* Decorative elements */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-32 right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
      
      {/* Main content - adjusted padding to avoid logo overlap */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center pt-20 sm:pt-24 md:pt-32">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold text-white mb-3 md:mb-6 leading-tight">
          Find the Best
          <span className="block text-yellow-200">Happy Hours</span>
          Near You
        </h1>
        
        <p className="text-lg sm:text-xl md:text-xl text-white/90 mb-3 md:mb-6 max-w-2xl mx-auto leading-relaxed">
          Discover amazing deals, great drinks, and perfect spots to unwind after work
        </p>
        
        <div className="text-base sm:text-lg md:text-lg text-white/80 mb-4 md:mb-8 max-w-2xl mx-auto leading-relaxed hidden sm:block">
          <p className="mb-2">We are the best source for discovering and browsing deals in NYC.</p>
          <p>Over 200+ verified happy hours with more being added every week.</p>
        </div>
        
        <SearchBar />
        
        {/* Mobile carousels */}
        <MobileCarousels />
      </div>
    </div>
  );
};

export default Hero;
