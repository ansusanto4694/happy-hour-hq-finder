import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
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
    params.set('carousel', carousel.id.toString());
    params.set('carouselName', carousel.name);
    navigate(`/results?${params.toString()}`);
  };

  return (
    <div className="bg-card border rounded-lg mb-4">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-2">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{carousel.name}</h3>
        </div>
        <button
          onClick={handleViewAll}
          className="w-8 h-8 bg-primary/10 hover:bg-primary/20 rounded-full flex items-center justify-center transition-colors"
          aria-label="View all merchants"
        >
          <ChevronRight className="w-5 h-5 text-primary" />
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