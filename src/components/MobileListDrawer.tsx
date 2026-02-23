import React, { useEffect } from 'react';
import { SearchResults } from '@/components/SearchResults';
import { MobileFilterDrawer } from '@/components/MobileFilterDrawer';
import { RadiusOption } from '@/components/RadiusFilter';
import { useAnalytics } from '@/hooks/useAnalytics';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { GripHorizontal } from 'lucide-react';

interface MobileListDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  merchants: any[];
  isLoading: boolean;
  error: any;
  startTime: string;
  endTime: string;
  location: string;
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
  selectedRadius: RadiusOption;
  onRadiusChange: (radius: RadiusOption) => void;
  isRadiusEnabled: boolean;
  showOffersOnly: boolean;
  onShowOffersChange: (show: boolean) => void;
  selectedDays: number[];
  onDaysChange: (days: number[]) => void;
  onStartTimeChange: (time: string) => void;
  onEndTimeChange: (time: string) => void;
  selectedMenuType: 'all' | 'food_and_drinks' | 'drinks_only';
  onMenuTypeChange: (menuType: 'all' | 'food_and_drinks' | 'drinks_only') => void;
  onMerchantNavigate?: (merchantId: number) => void;
  happeningNow?: boolean;
  onHappeningNowChange?: (value: boolean) => void;
  happeningToday?: boolean;
  onHappeningTodayChange?: (value: boolean) => void;
  locationType?: string | null;
  onClearAllFilters?: () => void;
}

export const MobileListDrawer: React.FC<MobileListDrawerProps> = ({
  isOpen,
  onOpenChange,
  merchants,
  isLoading,
  error,
  startTime,
  endTime,
  location,
  selectedCategories,
  onCategoryChange,
  selectedRadius,
  onRadiusChange,
  isRadiusEnabled,
  showOffersOnly,
  onShowOffersChange,
  selectedDays,
  onDaysChange,
  onStartTimeChange,
  onEndTimeChange,
  selectedMenuType,
  onMenuTypeChange,
  onMerchantNavigate,
  happeningNow,
  onHappeningNowChange,
  happeningToday,
  onHappeningTodayChange,
  locationType,
  onClearAllFilters,
}) => {
  const { track } = useAnalytics();

  useEffect(() => {
    if (isOpen) {
      track({
        eventType: 'interaction',
        eventCategory: 'navigation',
        eventAction: 'mobile_drawer_opened',
        metadata: {
          resultsCount: merchants?.length || 0
        },
      });
    }
  }, [isOpen, merchants, track]);

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange} shouldScaleBackground={false} modal={false}>
      <DrawerContent className="max-h-[85vh] flex flex-col overflow-hidden">
        <DrawerHeader className="pb-4 flex-shrink-0">
          <div className="flex items-center justify-center mb-2">
            <GripHorizontal className="h-6 w-6 text-gray-400" />
          </div>
          <div className="flex items-center justify-between">
            <DrawerTitle>Results ({merchants?.length || 0})</DrawerTitle>
            <MobileFilterDrawer
              selectedCategories={selectedCategories}
              onCategoryChange={onCategoryChange}
              selectedRadius={selectedRadius}
              onRadiusChange={onRadiusChange}
              isRadiusEnabled={isRadiusEnabled}
              showOffersOnly={showOffersOnly}
              onShowOffersChange={onShowOffersChange}
              selectedDays={selectedDays}
              onDaysChange={onDaysChange}
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
              onClearAllFilters={onClearAllFilters}
            />
          </div>
        </DrawerHeader>
        
        <div 
          data-vaul-drawer-scroll="true"
          className="px-4 pb-20 overflow-y-auto flex-1"
          style={{ minHeight: 0 }}
        >
          <SearchResults 
            merchants={merchants}
            isLoading={isLoading}
            error={error}
            startTime={startTime}
            endTime={endTime}
            location={location}
            isMobile={true}
            onMerchantNavigate={onMerchantNavigate}
            happeningNow={happeningNow}
            happeningToday={happeningToday}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
};
