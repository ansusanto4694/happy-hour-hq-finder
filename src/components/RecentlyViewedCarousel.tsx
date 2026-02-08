import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileCarouselCard } from './MobileCarouselCard';
import { CarouselCard } from './CarouselCard';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';

export const RecentlyViewedCarousel: React.FC = () => {
  const { recentlyViewed } = useRecentlyViewed();
  const isMobile = useIsMobile();
  const [api, setApi] = useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  useEffect(() => {
    if (!api) return;

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

  if (recentlyViewed.length === 0) {
    return null;
  }

  if (isMobile) {
    return (
      <div className="bg-card border rounded-lg mb-4">
        {/* Header */}
        <div className="p-4 pb-2">
          <h3 className="text-lg font-semibold text-foreground">Recently Viewed</h3>
        </div>

        {/* Scrollable carousel */}
        <div
          className="flex overflow-x-auto scrollbar-hide gap-3 px-4 pb-4"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {recentlyViewed.map((merchant) => (
            <MobileCarouselCard
              key={merchant.id}
              merchant={merchant}
            />
          ))}
        </div>
      </div>
    );
  }

  // Desktop
  return (
    <div className="bg-card rounded-lg border p-4 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold text-foreground">Recently Viewed</h2>

        {/* Navigation buttons only */}
        <div className="flex space-x-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => api?.scrollPrev()}
            className="h-8 w-8 p-0"
            disabled={!canScrollPrev}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => api?.scrollNext()}
            className="h-8 w-8 p-0"
            disabled={!canScrollNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Carousel */}
      <Carousel
        opts={{
          align: 'start',
          loop: false,
        }}
        setApi={setApi}
        className="w-full"
      >
        <CarouselContent className="-ml-3 md:-ml-4">
          {recentlyViewed.map((merchant) => (
            <CarouselItem key={merchant.id} className="pl-3 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4 2xl:basis-1/5">
              <CarouselCard merchant={merchant} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
};
