import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileCarouselCard } from './MobileCarouselCard';
import { HomepageCarousel as CarouselType } from '@/hooks/useHomepageCarousels';
import { useSearchResultsNavigation } from '@/hooks/useSearchResultsNavigation';

interface MobileCarouselProps {
  carousel: CarouselType;
}

export const MobileCarousel: React.FC<MobileCarouselProps> = ({ carousel }) => {
  const navigate = useNavigate();
  const { handleRestaurantClick } = useSearchResultsNavigation();
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!carousel.merchants || carousel.merchants.length === 0) {
    return null;
  }

  const handleViewAll = () => {
    const params = new URLSearchParams();
    params.set('carousel_id', carousel.id.toString());
    params.set('carousel_name', carousel.name);
    navigate(`/results?${params.toString()}`);
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg mx-4 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-2">
        <div>
          <h3 className="text-lg font-semibold text-white">{carousel.name}</h3>
        </div>
        <button
          onClick={handleViewAll}
          className="text-sm font-medium text-yellow-200 hover:text-yellow-100 transition-colors px-3 py-1 rounded-full bg-white/10"
        >
          View All
        </button>
      </div>

      {/* Scrollable carousel */}
      <div 
        ref={scrollRef}
        className="flex overflow-x-auto scrollbar-hide gap-3 px-4 pb-4"
        style={{ scrollSnapType: 'x mandatory' }}
      >
      {carousel.merchants.map((item) => (
        <MobileCarouselCard
          key={item.merchant.id}
          merchant={item.merchant}
          onClick={() => handleRestaurantClick(item.merchant.id)}
        />
      ))}
      </div>
    </div>
  );
};