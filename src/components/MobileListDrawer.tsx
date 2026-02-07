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
import { MapPin, Clock } from 'lucide-react';

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
  carouselName?: string;
}

const formatTime = (time?: string) => {
  if (!time) return '';
  if (time.toUpperCase().includes('AM') || time.toUpperCase().includes('PM')) {
    return time;
  }
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

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
  carouselName,
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

  // Build contextual title
  const headerTitle = carouselName
    ? carouselName
    : location
      ? `Happy Hours in ${location}`
      : 'Happy Hours Near You';

  const hasTimeFilter = !!(startTime && endTime);
  const resultCount = merchants?.length || 0;

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange} shouldScaleBackground={false} modal={false}>
      <DrawerContent className="max-h-[85vh] flex flex-col overflow-hidden">
        <DrawerHeader className="pb-3 pt-1 flex-shrink-0 border-b border-border">
          {/* Drag handle */}
          <div className="flex items-center justify-center py-1">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>

          {/* Title row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <DrawerTitle className="text-base font-semibold text-foreground truncate">
                {headerTitle}
              </DrawerTitle>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-muted-foreground font-medium">
                  {resultCount} {resultCount === 1 ? 'result' : 'results'}
                </span>
                {location && !carouselName && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate max-w-[120px]">{location}</span>
                  </span>
                )}
                {hasTimeFilter && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 flex-shrink-0" />
                    {formatTime(startTime)}–{formatTime(endTime)}
                  </span>
                )}
              </div>
            </div>
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
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
};
