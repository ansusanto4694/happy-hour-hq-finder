import React, { useState } from 'react';
import { SearchResults } from '@/components/SearchResults';
import { MobileFilterDrawer } from '@/components/MobileFilterDrawer';
import { RadiusOption } from '@/components/RadiusFilter';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { GripHorizontal } from 'lucide-react';
import { SearchResultCard } from '@/components/SearchResultCard';
import { useSearchResultsNavigation } from '@/hooks/useSearchResultsNavigation';

interface MobileListDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  merchants: any[];
  selectedMapMerchant?: any;
  onSelectedMapMerchantChange?: (merchant: any) => void;
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
}

export const MobileListDrawer: React.FC<MobileListDrawerProps> = ({
  isOpen,
  onOpenChange,
  merchants,
  selectedMapMerchant,
  onSelectedMapMerchantChange,
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
}) => {
  const { handleRestaurantClick } = useSearchResultsNavigation();

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="pb-4">
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
            />
          </div>
        </DrawerHeader>
        
        <div className="px-4 pb-4 overflow-auto">
          {selectedMapMerchant ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Selected Restaurant</h3>
                <button 
                  onClick={() => onSelectedMapMerchantChange?.(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Back to List
                </button>
              </div>
              <SearchResultCard 
                restaurant={selectedMapMerchant}
                onClick={handleRestaurantClick}
                isMobile={true}
              />
            </div>
          ) : (
            <SearchResults 
              merchants={merchants}
              isLoading={isLoading}
              error={error}
              startTime={startTime}
              endTime={endTime}
              location={location}
              isMobile={true}
            />
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};