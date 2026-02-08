import React, { useEffect } from 'react';
import { UnifiedFilterBar } from '@/components/UnifiedFilterBar';
import { RadiusOption } from '@/components/RadiusFilter';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAnalytics } from '@/hooks/useAnalytics';

// Mobile filter drawer with analytics tracking

interface MobileFilterDrawerV2Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
  selectedRadius: RadiusOption;
  onRadiusChange: (radius: RadiusOption) => void;
  isRadiusEnabled: boolean;
  showOffersOnly: boolean;
  onShowOffersChange: (show: boolean) => void;
  selectedDays: number[];
  onDaysChange: (days: number[]) => void;
  startTime: string;
  endTime: string;
  onStartTimeChange: (time: string) => void;
  onEndTimeChange: (time: string) => void;
  selectedMenuType: 'all' | 'food_and_drinks' | 'drinks_only';
  onMenuTypeChange: (menuType: 'all' | 'food_and_drinks' | 'drinks_only') => void;
  happeningNow?: boolean;
  onHappeningNowChange?: (value: boolean) => void;
  happeningToday?: boolean;
  onHappeningTodayChange?: (value: boolean) => void;
  locationType?: string | null;
}

export const MobileFilterDrawerV2: React.FC<MobileFilterDrawerV2Props> = ({
  isOpen,
  onOpenChange,
  selectedCategories,
  onCategoryChange,
  selectedRadius,
  onRadiusChange,
  isRadiusEnabled,
  showOffersOnly,
  onShowOffersChange,
  selectedDays,
  onDaysChange,
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  selectedMenuType,
  onMenuTypeChange,
  happeningNow,
  onHappeningNowChange,
  happeningToday,
  onHappeningTodayChange,
  locationType,
}) => {
  const { track } = useAnalytics();

  // Track drawer open/close
  useEffect(() => {
    if (isOpen) {
      track({
        eventType: 'interaction',
        eventCategory: 'mobile_filter_drawer',
        eventAction: 'drawer_opened',
        metadata: {
          active_filters: {
            categories: selectedCategories.length,
            radius: selectedRadius,
            offers_only: showOffersOnly,
            days: selectedDays.length,
            time_range: `${startTime}-${endTime}`,
            happening_now: happeningNow
          }
        }
      });
    }
  }, [isOpen]);

  const handleCategoryChange = (categories: string[]) => {
    onCategoryChange(categories);
    track({
      eventType: 'interaction',
      eventCategory: 'mobile_filter_drawer',
      eventAction: 'category_changed',
      eventLabel: categories.join(','),
      metadata: { category_count: categories.length }
    });
  };

  const handleRadiusChange = (radius: RadiusOption) => {
    onRadiusChange(radius);
    track({
      eventType: 'interaction',
      eventCategory: 'mobile_filter_drawer',
      eventAction: 'radius_changed',
      eventLabel: radius,
      metadata: { radius }
    });
  };

  const handleOffersChange = (show: boolean) => {
    onShowOffersChange(show);
    track({
      eventType: 'interaction',
      eventCategory: 'mobile_filter_drawer',
      eventAction: 'offers_toggled',
      eventLabel: show ? 'enabled' : 'disabled',
      metadata: { offers_only: show }
    });
  };

  const handleDaysChange = (days: number[]) => {
    onDaysChange(days);
    track({
      eventType: 'interaction',
      eventCategory: 'mobile_filter_drawer',
      eventAction: 'days_changed',
      metadata: { days, day_count: days.length }
    });
  };

  const handleClose = () => {
    track({
      eventType: 'interaction',
      eventCategory: 'mobile_filter_drawer',
      eventAction: 'drawer_closed',
      metadata: {
        final_filters: {
          categories: selectedCategories.length,
          radius: selectedRadius,
          offers_only: showOffersOnly,
          days: selectedDays.length,
          happening_now: happeningNow
        }
      }
    });
    onOpenChange(false);
  };

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="flex flex-row items-center justify-between">
          <DrawerTitle>Filters</DrawerTitle>
          <DrawerClose asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </DrawerClose>
        </DrawerHeader>
        
        <div className="px-4 pb-6 overflow-auto">
          <UnifiedFilterBar
            selectedCategories={selectedCategories}
            onCategoryChange={handleCategoryChange}
            selectedRadius={selectedRadius}
            onRadiusChange={handleRadiusChange}
            isRadiusEnabled={isRadiusEnabled}
            showOffersOnly={showOffersOnly}
            onShowOffersChange={handleOffersChange}
            selectedDays={selectedDays}
            onDaysChange={handleDaysChange}
            startTime={startTime}
            endTime={endTime}
            onStartTimeChange={onStartTimeChange}
            onEndTimeChange={onEndTimeChange}
            selectedMenuType={selectedMenuType}
            onMenuTypeChange={onMenuTypeChange}
            happeningNow={happeningNow}
            onHappeningNowChange={onHappeningNowChange}
            happeningToday={happeningToday}
            onHappeningTodayChange={onHappeningTodayChange}
            locationType={locationType}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
};
