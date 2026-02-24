import React, { useEffect, useMemo } from 'react';
import Hero from '@/components/Hero';
import { HomepageCarousels } from '@/components/HomepageCarousels';
import { SEOHead } from '@/components/SEOHead';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Footer } from '@/components/Footer';
import { PageHeader } from '@/components/PageHeader';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { HomepageCarousel } from '@/components/HomepageCarousel';
import { HomepageCarousel as CarouselType } from '@/hooks/useHomepageCarousels';

const Index = () => {
  const isMobile = useIsMobile();
  const { trackFunnel } = useAnalytics();
  const { recentlyViewed } = useRecentlyViewed();

  useEffect(() => {
    trackFunnel({
      funnelStep: 'homepage_view',
      stepOrder: 1
    });
  }, [trackFunnel]);

  // Shape recently viewed data into the HomepageCarousel type
  const recentlyViewedCarousel = useMemo((): CarouselType | null => {
    if (recentlyViewed.length === 0) return null;
    return {
      id: 'recently-viewed',
      name: 'Recently Viewed',
      display_order: -1,
      merchants: recentlyViewed.map((m, i) => ({
        id: `rv-${m.id}`,
        merchant_id: m.id,
        display_order: i,
        merchant: {
          id: m.id,
          restaurant_name: m.restaurant_name,
          street_address: '',
          city: '',
          state: '',
          zip_code: '',
          logo_url: m.logo_url ?? undefined,
          neighborhood: m.neighborhood ?? undefined,
          slug: m.slug ?? undefined,
          merchant_happy_hour: m.merchant_happy_hour,
          happy_hour_deals: (m.happy_hour_deals || []).map(d => ({
            id: '',
            active: d.active,
            menu_type: d.menu_type,
          })),
          merchant_reviews: m.merchant_reviews,
        },
      })),
    };
  }, [recentlyViewed]);

  // Mobile version
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
          <Hero recentlyViewedCarousel={recentlyViewedCarousel} />
          
          <HomepageCarousels />
          <Footer />
        </div>
      </div>
    );
  }

  // Desktop version
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-orange-400 via-amber-500 to-yellow-500">
      <div className="absolute inset-0 bg-black/10"></div>
      <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-32 right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
      
      <div className="relative z-10">
        <SEOHead 
          title="SipMunchYap - Find the Best Happy Hours Near You"
          description="Discover amazing happy hour deals, restaurants, and bars in your area. Compare prices, find deals, and plan your perfect night out with SipMunchYap."
          keywords="happy hour, bars, restaurants, drinks, food deals, nightlife, local bars, restaurant finder"
          canonical="https://sipmunchyap.com/"
        />
        
        <PageHeader showSearchBar={true} searchBarVariant="results" />
        
        <div className="max-w-6xl mx-auto px-6 pt-24 pb-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Find the best happy hours near you
          </h1>
          
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
            Discover amazing deals, great drinks, and perfect spots to unwind after work
          </p>
          
          <div className="text-lg text-white/80 mb-8 max-w-2xl mx-auto leading-relaxed">
            <p className="mb-2">We are the best source for discovering and browsing deals in NYC.</p>
            <p>Over 700+ verified happy hours with more being added every week.</p>
          </div>

          {/* Trust Stats Bar */}
          <div className="flex items-center justify-center gap-8 mb-12">
            <div className="flex flex-col items-center px-6 py-3 bg-white/15 backdrop-blur-sm rounded-xl border border-white/20">
              <span className="text-2xl font-bold text-white">700+</span>
              <span className="text-xs text-white/80 uppercase tracking-wider font-medium">Happy Hours</span>
            </div>
            <div className="flex flex-col items-center px-6 py-3 bg-white/15 backdrop-blur-sm rounded-xl border border-white/20">
              <span className="text-2xl font-bold text-white">50+</span>
              <span className="text-xs text-white/80 uppercase tracking-wider font-medium">Neighborhoods</span>
            </div>
            <div className="flex flex-col items-center px-6 py-3 bg-white/15 backdrop-blur-sm rounded-xl border border-white/20">
              <span className="text-2xl font-bold text-white">Weekly</span>
              <span className="text-xs text-white/80 uppercase tracking-wider font-medium">Updates</span>
            </div>
          </div>
        </div>
        
        {/* Recently Viewed + Carousels */}
        <div className="w-full px-6 lg:px-8 xl:px-12">
          {recentlyViewedCarousel && (
            <HomepageCarousel carousel={recentlyViewedCarousel} hideViewAll />
          )}
        </div>
        <HomepageCarousels />
        <Footer />
      </div>
    </div>
  );
};

export default Index;
