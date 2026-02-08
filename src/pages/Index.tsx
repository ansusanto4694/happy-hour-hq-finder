import React, { useEffect } from 'react';
import { SearchBar } from '@/components/SearchBar';
import Hero from '@/components/Hero';
import { HomepageCarousels } from '@/components/HomepageCarousels';
import { SEOHead } from '@/components/SEOHead';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Footer } from '@/components/Footer';
import { PageHeader } from '@/components/PageHeader';
import { RecentlyViewedCarousel } from '@/components/RecentlyViewedCarousel';
import { Link } from 'react-router-dom';

const Index = () => {
  const isMobile = useIsMobile();
  const { trackFunnel } = useAnalytics();

  useEffect(() => {
    trackFunnel({
      funnelStep: 'homepage_view',
      stepOrder: 1
    });
  }, [trackFunnel]);

  // Mobile version - keep existing Hero component
  if (isMobile) {
    return (
      <div className="relative min-h-screen pb-16 bg-gradient-to-br from-orange-400 via-amber-500 to-yellow-500">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <SEOHead 
            title="SipMunchYap - Find the Best Happy Hours Near You"
            description="Discover amazing happy hour deals, restaurants, and bars in your area. Compare prices, find deals, and plan your perfect night out with SipMunchYap."
            keywords="happy hour, bars, restaurants, drinks, food deals, nightlife, local bars, restaurant finder"
            canonical="https://sipmunchyap.com/"
          />
          <Hero />
          
          
          <HomepageCarousels />
          <Footer />
        </div>
      </div>
    );
  }

  // Desktop version - new layout
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-orange-400 via-amber-500 to-yellow-500">
      <div className="absolute inset-0 bg-black/10"></div>
      {/* Decorative elements */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-32 right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
      
      <div className="relative z-10">
        <SEOHead 
          title="SipMunchYap - Find the Best Happy Hours Near You"
          description="Discover amazing happy hour deals, restaurants, and bars in your area. Compare prices, find deals, and plan your perfect night out with SipMunchYap."
          keywords="happy hour, bars, restaurants, drinks, food deals, nightlife, local bars, restaurant finder"
          canonical="https://sipmunchyap.com/"
        />
        
        {/* Header with company name, search bar, and navigation */}
        <PageHeader showSearchBar={true} searchBarVariant="results" />
        
        {/* Main content */}
        <div className="max-w-6xl mx-auto px-6 pt-44 pb-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Find the best happy hours near you
          </h1>
          
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
            Discover amazing deals, great drinks, and perfect spots to unwind after work
          </p>
          
          <div className="text-lg text-white/80 mb-12 max-w-2xl mx-auto leading-relaxed">
            <p className="mb-2">We are the best source for discovering and browsing deals in NYC.</p>
            <p>Over 700+ verified happy hours with more being added every week.</p>
          </div>
        </div>
        
        {/* Recently Viewed + Carousels */}
        <div className="w-full px-6 lg:px-8 xl:px-12">
          <RecentlyViewedCarousel />
        </div>
        <HomepageCarousels />
        <Footer />
      </div>
    </div>
  );
};

export default Index;
