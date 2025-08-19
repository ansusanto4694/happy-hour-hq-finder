import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { SearchResultCard } from './SearchResultCard';
import { HomepageCarousel as CarouselType } from '@/hooks/useHomepageCarousels';

interface HomepageCarouselProps {
  carousel: CarouselType;
}

export const HomepageCarousel: React.FC<HomepageCarouselProps> = ({ carousel }) => {
  const navigate = useNavigate();

  const handleViewAll = () => {
    // Navigate to results page with carousel filter
    const merchantIds = carousel.merchants.map(m => m.merchant.id);
    const searchParams = new URLSearchParams();
    searchParams.set('carousel', carousel.id);
    searchParams.set('carouselName', carousel.name);
    navigate(`/results?${searchParams.toString()}`);
  };

  if (!carousel.merchants.length) {
    return null;
  }

  return (
    <div className="bg-card rounded-lg border p-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">{carousel.name}</h2>
          {carousel.description && (
            <p className="text-sm text-muted-foreground mt-1">{carousel.description}</p>
          )}
        </div>
        
        {/* Controls */}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewAll}
            className="flex items-center space-x-1"
          >
            <span>View All</span>
            <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Carousel */}
      <Carousel
        opts={{
          align: "start",
          loop: false,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {carousel.merchants.map((merchantData) => (
            <CarouselItem key={merchantData.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
              <SearchResultCard
                restaurant={{
                  ...merchantData.merchant,
                  distance: null, // Not applicable for carousels
                }}
                onClick={(restaurantId) => navigate(`/restaurant/${restaurantId}`)}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        
        {/* Navigation buttons - positioned in top right */}
        <div className="absolute -top-16 right-0 flex space-x-1">
          <CarouselPrevious className="relative translate-y-0 left-auto top-auto h-8 w-8" />
          <CarouselNext className="relative translate-y-0 right-auto top-auto h-8 w-8" />
        </div>
      </Carousel>
    </div>
  );
};