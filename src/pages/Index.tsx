
import React from 'react';
import Hero from '@/components/Hero';
import { GeocodingManager } from '@/components/GeocodingManager';

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Hero />
      
      {/* Add geocoding manager for admin/setup purposes */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-center">
          <GeocodingManager />
        </div>
      </div>
    </div>
  );
};

export default Index;
