
import React from 'react';
import { Link } from 'react-router-dom';
import { SearchBar } from '@/components/SearchBar';
import { AuthButton } from '@/components/AuthButton';
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
        
        {/* Header with company name, search bar, and navigation */}
        <div className="absolute top-4 left-4 right-4 md:top-6 md:left-6 md:right-6 z-20 flex justify-between items-center">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
            SipMunchYap
          </h2>
          <nav className="flex items-center space-x-4 md:space-x-6">
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

        {/* Main content with search bar */}
        <div className="pt-24 md:pt-32 px-6">
          {/* Search Bar */}
          <div className="max-w-4xl mx-auto mb-8">
            <SearchBar variant="hero" />
          </div>
          
          {/* Tagline and Message */}
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
              Find the Best Happy Hours Near You
            </h1>
            <p className="text-lg sm:text-xl md:text-xl text-white/90 leading-relaxed">
              Discover amazing deals, great drinks, and perfect spots to unwind after work
            </p>
          </div>
        </div>

        {/* Carousels */}
        <HomepageCarousels />
      </div>
    </div>
  );
};

export default Index;
