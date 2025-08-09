import React from 'react';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';


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
  onOpenChange?: (open: boolean) => void;
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
  onOpenChange,
}) => {
  
  const hasFilters = selectedCategories.length > 0 || selectedRadius !== 'walking' || showOffersOnly;

  return (
    <Button 
      variant="outline" 
      size="sm"
      onClick={() => onOpenChange?.(true)}
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
  );
};