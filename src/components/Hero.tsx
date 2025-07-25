
import React from 'react';
import { SearchBar } from './SearchBar';

const Hero = () => {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-orange-400 via-amber-500 to-yellow-500 flex items-center justify-center overflow-hidden">
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black/20"></div>
      
      {/* Company name in top left - mobile friendly positioning */}
      <div className="absolute top-4 left-4 md:top-6 md:left-6 z-20">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
          Happy.Hour
        </h2>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-32 right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
      
      {/* Main content - adjusted padding to avoid logo overlap */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center mt-16 sm:mt-12 md:mt-0">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-white mb-4 md:mb-6 leading-tight">
          Find the Best
          <span className="block text-yellow-200">Happy Hours</span>
          Near You
        </h1>
        
        <p className="text-lg sm:text-xl md:text-2xl text-white/90 mb-6 md:mb-8 max-w-2xl mx-auto leading-relaxed">
          Discover amazing deals, great drinks, and perfect spots to unwind after work
        </p>
        
        <div onClick={() => console.log('🧪 HERO DIV CLICKED')}>
          <SearchBar variant="vertical" />
        </div>
        
        <div className="mt-6 md:mt-8 text-white/80 text-xs sm:text-sm">
          <p>Popular searches: <span className="text-yellow-200">2-for-1 drinks</span>, <span className="text-yellow-200">food specials</span>, <span className="text-yellow-200">rooftop bars</span></p>
        </div>
      </div>
    </div>
  );
};

export default Hero;
