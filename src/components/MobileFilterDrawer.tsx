import React from 'react';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MobileFilterDrawerV2 } from '@/components/MobileFilterDrawerV2';
import { RadiusOption } from './RadiusFilter';

interface MobileFilterDrawerProps {
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
  selectedRadius: RadiusOption;
  onRadiusChange: (radius: RadiusOption) => void;
  isRadiusEnabled: boolean;
  showOffersOnly: boolean;
  onShowOffersChange: (showOffers: boolean) => void;
  selectedDays: number[];
  onDaysChange: (days: number[]) => void;
  startTime: string;
  endTime: string;
  onStartTimeChange: (time: string) => void;
  onEndTimeChange: (time: string) => void;
  onFilterClick?: () => void;
}

export const MobileFilterDrawer: React.FC<MobileFilterDrawerProps> = ({
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
  onFilterClick,
}) => {
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = React.useState(false);
  const hasFilters = selectedCategories.length > 0 || selectedRadius !== 'walking' || showOffersOnly || selectedDays.length > 0 || startTime || endTime;
  
  // Calculate total filter count
  const filterCount = 
    selectedCategories.length + 
    selectedDays.length + 
    (startTime ? 1 : 0) + 
    (endTime ? 1 : 0) + 
    (selectedRadius !== 'walking' ? 1 : 0) + 
    (showOffersOnly ? 1 : 0);

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
        className={`relative h-11 px-4 ${hasFilters ? 'border-2 border-orange-500 bg-orange-50 text-orange-700 font-semibold' : ''} active:scale-95 transition-transform`}
      >
        <Filter className="w-4 h-4 mr-2" />
        Filters
        {hasFilters && (
          <span className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-md animate-pulse">
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
      />
    </>
  );
};