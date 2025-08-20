
import React from 'react';
import Hero from '@/components/Hero';
import { HomepageCarousels } from '@/components/HomepageCarousels';
import { SEOHead } from '@/components/SEOHead';

const Index = () => {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-orange-400 via-amber-500 to-yellow-500">
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black/20"></div>
      
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
};

export default Index;
