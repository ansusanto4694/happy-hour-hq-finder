import React from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerClose } from '@/components/ui/drawer';
import { UnifiedFilterBar } from './UnifiedFilterBar';
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
}) => {
  const hasFilters = selectedCategories.length > 0 || selectedRadius !== 'walking' || showOffersOnly;

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className={`relative ${hasFilters ? 'border-orange-500 text-orange-600' : ''}`}
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
          {hasFilters && (
            <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {selectedCategories.length}
            </span>
          )}
        </Button>
      </DrawerTrigger>

      <DrawerContent className="z-[200] h-[96dvh]">
        <DrawerHeader className="relative border-b">
          <DrawerClose asChild>
            <button aria-label="Close filters" className="absolute left-4 top-3 p-2 rounded-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring">
              <X className="h-5 w-5" />
            </button>
          </DrawerClose>
          <DrawerTitle>Filters</DrawerTitle>
        </DrawerHeader>

        <div className="mt-4 overflow-y-auto h-[calc(96dvh-72px)] px-4 pb-6">
          <UnifiedFilterBar
            selectedCategories={selectedCategories}
            onCategoryChange={onCategoryChange}
            selectedRadius={selectedRadius}
            onRadiusChange={onRadiusChange}
            isRadiusEnabled={isRadiusEnabled}
            showOffersOnly={showOffersOnly}
            onShowOffersChange={onShowOffersChange}
            selectedDays={selectedDays}
            onDaysChange={onDaysChange}
            vertical={true}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
};