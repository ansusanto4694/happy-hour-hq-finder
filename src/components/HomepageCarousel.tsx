import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { CarouselCard } from './CarouselCard';
import { HomepageCarousel as CarouselType } from '@/hooks/useHomepageCarousels';

interface HomepageCarouselProps {
  carousel: CarouselType;
}

export const HomepageCarousel: React.FC<HomepageCarouselProps> = ({ carousel }) => {
  const navigate = useNavigate();
  const [api, setApi] = useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  useEffect(() => {
    if (!api) {
      return;
    }

    const updateCanScroll = () => {
      setCanScrollPrev(api.canScrollPrev());
      setCanScrollNext(api.canScrollNext());
    };

    updateCanScroll();
    api.on('reInit', updateCanScroll);
    api.on('select', updateCanScroll);

    return () => {
      api.off('reInit', updateCanScroll);
      api.off('select', updateCanScroll);
    };
  }, [api]);

  const handleViewAll = () => {
    // Navigate to results page with carousel filter
    const merchantIds = carousel.merchants.map(m => m.merchant.id);
    const searchParams = new URLSearchParams();
    searchParams.set('carousel', carousel.id);
    searchParams.set('carouselName', carousel.name);
    navigate(`/results?${searchParams.toString()}`);
  };

  const scrollPrev = () => {
    api?.scrollPrev();
  };

  const scrollNext = () => {
    api?.scrollNext();
  };

  if (!carousel.merchants.length) {
    return null;
  }

  return (
    <div className="bg-card rounded-lg border p-4 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-xl font-semibold text-foreground">{carousel.name}</h2>
          {carousel.description && (
            <p className="text-sm text-muted-foreground mt-1">{carousel.description}</p>
          )}
        </div>
        
        {/* Controls */}
        <div className="flex items-center space-x-2">
          {/* Navigation buttons */}
          <div className="flex space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={scrollPrev}
              className="h-8 w-8 p-0"
              disabled={!canScrollPrev}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={scrollNext}
              className="h-8 w-8 p-0"
              disabled={!canScrollNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
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
        setApi={setApi}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {carousel.merchants.map((merchantData) => (
            <CarouselItem key={merchantData.id} className="pl-2 md:pl-4 basis-1/3 lg:basis-1/4 xl:basis-1/5">
              <CarouselCard
                merchant={merchantData.merchant}
                onClick={(merchantId) => navigate(`/restaurant/${merchantId}`)}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
};