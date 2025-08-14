import React from 'react';
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
}) => {
  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="flex flex-row items-center justify-between">
          <DrawerTitle>Filters</DrawerTitle>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <X className="h-4 w-4" />
            </Button>
          </DrawerClose>
        </DrawerHeader>
        
        <div className="px-4 pb-6 overflow-auto">
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
            startTime={startTime}
            endTime={endTime}
            onStartTimeChange={onStartTimeChange}
            onEndTimeChange={onEndTimeChange}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
};