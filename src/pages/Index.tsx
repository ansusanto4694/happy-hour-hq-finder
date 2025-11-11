import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SearchBar } from '@/components/SearchBar';
import { AuthButton } from '@/components/AuthButton';
import Hero from '@/components/Hero';
import { HomepageCarousels } from '@/components/HomepageCarousels';
import { SEOHead } from '@/components/SEOHead';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAnalytics } from '@/hooks/useAnalytics';

const Index = () => {
  const isMobile = useIsMobile();
  const { trackPage } = useAnalytics();

  useEffect(() => {
    trackPage();
  }, [trackPage]);

  // Mobile version - keep existing Hero component
  if (isMobile) {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-orange-400 via-amber-500 to-yellow-500">
        {/* Background overlay */}
        <div className="absolute inset-0 bg-black/10"></div>
        
        <div className="relative z-10">
          <SEOHead 
            title="SipMunchYap - Find the Best Happy Hours Near You"
            description="Discover amazing happy hour deals, restaurants, and bars in your area. Compare prices, find deals, and plan your perfect night out with SipMunchYap."
            keywords="happy hour, bars, restaurants, drinks, food deals, nightlife, local bars, restaurant finder"
            canonical={typeof window !== 'undefined' ? window.location.href : ''}
          />
          <Hero />
          <HomepageCarousels />
        </div>
      </div>
    );
  }

  // Desktop version - new layout
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-orange-400 via-amber-500 to-yellow-500">
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black/10"></div>
      
      {/* Decorative elements */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-32 right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
      
      <div className="relative z-10">
        <SEOHead 
          title="SipMunchYap - Find the Best Happy Hours Near You"
          description="Discover amazing happy hour deals, restaurants, and bars in your area. Compare prices, find deals, and plan your perfect night out with SipMunchYap."
          keywords="happy hour, bars, restaurants, drinks, food deals, nightlife, local bars, restaurant finder"
          canonical={typeof window !== 'undefined' ? window.location.href : ''}
        />
        
        {/* Header with company name, search bar, and navigation */}
        <div className="bg-white/10 backdrop-blur-sm border-b border-white/20">
          <div className="w-full px-8 py-1">
            <div className="flex items-center justify-between">
              <img 
                src="/lovable-uploads/f30134b8-b54d-491a-b6bc-fc7a20199dd2.png" 
                alt="SipMunchYap Logo" 
                className="h-24 md:h-32 w-auto"
              />
              
              {/* Search bar in header */}
              <div className="flex-1 mx-8">
                <SearchBar variant="results" />
              </div>
              
               <nav className="flex items-center space-x-4">
                 <Link 
                   to="/about" 
                   className="text-white/90 hover:text-white transition-colors text-sm font-medium"
                 >
                   About
                 </Link>
                 <Link 
                   to="/contact" 
                   className="text-white/90 hover:text-white transition-colors text-sm font-medium"
                 >
                   Contact
                 </Link>
                 <AuthButton />
               </nav>
            </div>
          </div>
        </div>
        
        {/* Main content */}
        <div className="max-w-6xl mx-auto px-6 pt-16 pb-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Find the best happy hours near you
          </h1>
          
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
            Discover amazing deals, great drinks, and perfect spots to unwind after work
          </p>
          
          <div className="text-lg text-white/80 mb-12 max-w-2xl mx-auto leading-relaxed">
            <p className="mb-2">We are the best source for discovering and browsing deals in NYC.</p>
            <p>Over 300+ verified happy hours with more being added every week.</p>
          </div>
        </div>
        
        {/* Carousels */}
        <HomepageCarousels />
      </div>
    </div>
  );
};

export default Index;
