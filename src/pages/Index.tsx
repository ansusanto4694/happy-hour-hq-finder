
import React from 'react';
import Hero from '@/components/Hero';
import GeocodingDebugger from '@/components/GeocodingDebugger';

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Hero />
      <div className="container mx-auto py-8">
        <GeocodingDebugger />
      </div>
    </div>
  );
};

export default Index;
