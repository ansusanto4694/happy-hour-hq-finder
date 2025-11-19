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
          
          {/* Mobile Popular Locations */}
          <div className="px-4 pb-6">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-4 text-center">
                Browse by Location
              </h2>
              
              {/* City Link */}
              <div className="mb-6">
                <Link 
                  to="/happy-hour/new-york-ny"
                  className="flex items-center justify-center gap-2 text-white bg-white/20 hover:bg-white/30 px-5 py-3 rounded-lg font-semibold transition-all w-full"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  NYC Happy Hours
                </Link>
              </div>

              {/* Popular Neighborhoods */}
              <div>
                <h3 className="text-sm font-semibold text-white/90 mb-3">Popular Neighborhoods</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Link 
                    to="/happy-hour/new-york-ny/east-village"
                    className="bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg text-white text-sm text-center transition-all border border-white/10"
                  >
                    East Village
                  </Link>
                  <Link 
                    to="/happy-hour/new-york-ny/west-village"
                    className="bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg text-white text-sm text-center transition-all border border-white/10"
                  >
                    West Village
                  </Link>
                  <Link 
                    to="/happy-hour/new-york-ny/williamsburg"
                    className="bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg text-white text-sm text-center transition-all border border-white/10"
                  >
                    Williamsburg
                  </Link>
                  <Link 
                    to="/happy-hour/new-york-ny/chelsea"
                    className="bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg text-white text-sm text-center transition-all border border-white/10"
                  >
                    Chelsea
                  </Link>
                </div>
              </div>
            </div>
          </div>
          
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
                   to="/happy-hour/new-york-ny" 
                   className="text-white/90 hover:text-white transition-colors text-sm font-medium"
                 >
                   NYC Happy Hours
                 </Link>
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

        {/* Popular Locations Section */}
        <div className="max-w-6xl mx-auto px-6 pb-12">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">
              Browse Happy Hours by Location
            </h2>
            
            {/* City Link */}
            <div className="mb-8">
              <Link 
                to="/happy-hour/new-york-ny"
                className="inline-flex items-center gap-2 text-white bg-white/20 hover:bg-white/30 px-6 py-3 rounded-lg font-semibold transition-all hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                View All New York City Happy Hours
              </Link>
            </div>

            {/* Popular Neighborhoods Grid */}
            <div>
              <h3 className="text-lg font-semibold text-white/90 mb-4">Popular NYC Neighborhoods</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                <Link 
                  to="/happy-hour/new-york-ny/east-village"
                  className="bg-white/10 hover:bg-white/20 px-4 py-3 rounded-lg text-white text-center transition-all hover:scale-105 border border-white/10"
                >
                  East Village
                </Link>
                <Link 
                  to="/happy-hour/new-york-ny/west-village"
                  className="bg-white/10 hover:bg-white/20 px-4 py-3 rounded-lg text-white text-center transition-all hover:scale-105 border border-white/10"
                >
                  West Village
                </Link>
                <Link 
                  to="/happy-hour/new-york-ny/williamsburg"
                  className="bg-white/10 hover:bg-white/20 px-4 py-3 rounded-lg text-white text-center transition-all hover:scale-105 border border-white/10"
                >
                  Williamsburg
                </Link>
                <Link 
                  to="/happy-hour/new-york-ny/lower-east-side"
                  className="bg-white/10 hover:bg-white/20 px-4 py-3 rounded-lg text-white text-center transition-all hover:scale-105 border border-white/10"
                >
                  Lower East Side
                </Link>
                <Link 
                  to="/happy-hour/new-york-ny/soho"
                  className="bg-white/10 hover:bg-white/20 px-4 py-3 rounded-lg text-white text-center transition-all hover:scale-105 border border-white/10"
                >
                  SoHo
                </Link>
                <Link 
                  to="/happy-hour/new-york-ny/chelsea"
                  className="bg-white/10 hover:bg-white/20 px-4 py-3 rounded-lg text-white text-center transition-all hover:scale-105 border border-white/10"
                >
                  Chelsea
                </Link>
                <Link 
                  to="/happy-hour/new-york-ny/midtown-east"
                  className="bg-white/10 hover:bg-white/20 px-4 py-3 rounded-lg text-white text-center transition-all hover:scale-105 border border-white/10"
                >
                  Midtown East
                </Link>
                <Link 
                  to="/happy-hour/new-york-ny/hells-kitchen"
                  className="bg-white/10 hover:bg-white/20 px-4 py-3 rounded-lg text-white text-center transition-all hover:scale-105 border border-white/10"
                >
                  Hell's Kitchen
                </Link>
                <Link 
                  to="/happy-hour/new-york-ny/financial-district"
                  className="bg-white/10 hover:bg-white/20 px-4 py-3 rounded-lg text-white text-center transition-all hover:scale-105 border border-white/10"
                >
                  Financial District
                </Link>
                <Link 
                  to="/happy-hour/new-york-ny/tribeca"
                  className="bg-white/10 hover:bg-white/20 px-4 py-3 rounded-lg text-white text-center transition-all hover:scale-105 border border-white/10"
                >
                  TriBeCa
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        {/* Carousels */}
        <HomepageCarousels />
      </div>
    </div>
  );
};

export default Index;
