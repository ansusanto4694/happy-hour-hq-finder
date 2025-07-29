import React from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { CategoryFilter } from './CategoryFilter';
import { RadiusFilter, RadiusOption } from './RadiusFilter';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface MobileFilterDrawerProps {
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
  selectedRadius: RadiusOption;
  onRadiusChange: (radius: RadiusOption) => void;
  isRadiusEnabled: boolean;
  showOffersOnly: boolean;
  onShowOffersChange: (showOffers: boolean) => void;
}

export const MobileFilterDrawer: React.FC<MobileFilterDrawerProps> = ({
  selectedCategories,
  onCategoryChange,
  selectedRadius,
  onRadiusChange,
  isRadiusEnabled,
  showOffersOnly,
  onShowOffersChange
}) => {
  const hasFilters = selectedCategories.length > 0 || selectedRadius !== 'blocks' || showOffersOnly;

  return (
    <Sheet>
      <SheetTrigger asChild>
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
      </SheetTrigger>
      
      <SheetContent side="left" className="w-[280px] sm:w-[320px]">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 overflow-y-auto h-[calc(100vh-120px)]">
          <div className="space-y-6">
            {/* Offers filter first */}
            <div className="flex items-center justify-between">
              <Label htmlFor="mobile-offers-toggle" className="text-sm font-medium">
                Show offers only
              </Label>
              <Switch
                id="mobile-offers-toggle"
                checked={showOffersOnly}
                onCheckedChange={onShowOffersChange}
              />
            </div>
            
            <Separator />
            
            {/* Category filter */}
            <CategoryFilter
              selectedCategories={selectedCategories}
              onCategoryChange={onCategoryChange}
              vertical={true}
            />
            
            <Separator />
            
            <RadiusFilter
              selectedRadius={selectedRadius}
              onRadiusChange={onRadiusChange}
              isEnabled={isRadiusEnabled}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};