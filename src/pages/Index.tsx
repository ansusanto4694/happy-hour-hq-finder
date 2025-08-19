
import React from 'react';
import Hero from '@/components/Hero';
import { HomepageCarousels } from '@/components/HomepageCarousels';
import { SEOHead } from '@/components/SEOHead';

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead 
        title="SipMunchYap - Find the Best Happy Hours Near You"
        description="Discover amazing happy hour deals, restaurants, and bars in your area. Compare prices, find deals, and plan your perfect night out with SipMunchYap."
        keywords="happy hour, bars, restaurants, drinks, food deals, nightlife, local bars, restaurant finder"
        canonical={typeof window !== 'undefined' ? window.location.href : ''}
      />
      <Hero />
      <HomepageCarousels />
    </div>
  );
};

export default Index;
