import React from 'react';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MobileFilterDrawerV2 } from '@/components/MobileFilterDrawerV2';
import { RadiusOption, getSmartDefaultRadius } from './RadiusFilter';

interface MobileFilterDrawerProps {
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
  selectedRadius: RadiusOption;
  onRadiusChange: (radius: RadiusOption) => void;
  isRadiusEnabled: boolean;
  showOffersOnly: boolean;
  onShowOffersChange: (showOffers: boolean) => void;
  useGPS?: boolean;
  selectedDays: number[];
  onDaysChange: (days: number[]) => void;
  startTime: string;
  endTime: string;
  onStartTimeChange: (time: string) => void;
  onEndTimeChange: (time: string) => void;
  selectedMenuType: 'all' | 'food_and_drinks' | 'drinks_only';
  onMenuTypeChange: (menuType: 'all' | 'food_and_drinks' | 'drinks_only') => void;
  onFilterClick?: () => void;
  onClearAllFilters?: () => void;
  happeningNow?: boolean;
  onHappeningNowChange?: (value: boolean) => void;
  happeningToday?: boolean;
  onHappeningTodayChange?: (value: boolean) => void;
  locationType?: string | null;
  neighborhoods?: { name: string; count: number }[];
  selectedNeighborhood?: string | null;
  onNeighborhoodChange?: (value: string | null) => void;
}

export const MobileFilterDrawer: React.FC<MobileFilterDrawerProps> = ({
  selectedCategories,
  onCategoryChange,
  selectedRadius,
  onRadiusChange,
  isRadiusEnabled,
  showOffersOnly,
  onShowOffersChange,
  useGPS = false,
  selectedDays,
  onDaysChange,
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  selectedMenuType,
  onMenuTypeChange,
  onFilterClick,
  onClearAllFilters,
  happeningNow,
  onHappeningNowChange,
  happeningToday,
  onHappeningTodayChange,
  locationType,
  neighborhoods,
  selectedNeighborhood,
  onNeighborhoodChange,
}) => {
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = React.useState(false);
  const smartDefault = getSmartDefaultRadius(locationType ?? null, useGPS);
  const hasFilters = selectedCategories.length > 0 || selectedRadius !== smartDefault || showOffersOnly || selectedDays.length > 0 || startTime || endTime || selectedMenuType !== 'all' || happeningNow || happeningToday;
  
  // Calculate total filter count
  const filterCount = 
    selectedCategories.length + 
    selectedDays.length + 
    (startTime ? 1 : 0) + 
    (endTime ? 1 : 0) + 
    (selectedRadius !== smartDefault ? 1 : 0) + 
    (showOffersOnly ? 1 : 0) +
    (selectedMenuType !== 'all' ? 1 : 0) +
    (happeningNow ? 1 : 0) +
    (happeningToday ? 1 : 0);

  const handleFilterClick = () => {
    if (onFilterClick) {
      onFilterClick();
    } else {
      setIsFilterDrawerOpen(true);
    }
  };

  return (
    <>
      <Button 
        variant="outline" 
        size="sm"
        onClick={handleFilterClick}
        className={`relative ${hasFilters ? 'border-orange-500 text-orange-600' : ''}`}
      >
        <Filter className="w-4 h-4 mr-2" />
        Filters
        {hasFilters && (
          <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {filterCount}
          </span>
        )}
      </Button>

      <MobileFilterDrawerV2
        isOpen={isFilterDrawerOpen}
        onOpenChange={setIsFilterDrawerOpen}
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
        neighborhoods={neighborhoods}
        selectedNeighborhood={selectedNeighborhood}
        onNeighborhoodChange={onNeighborhoodChange}
      />
    </>
  );
};
