import React from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { CategoryFilter } from './CategoryFilter';

interface MobileFilterDrawerProps {
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
}

export const MobileFilterDrawer: React.FC<MobileFilterDrawerProps> = ({
  selectedCategories,
  onCategoryChange,
}) => {
  const hasFilters = selectedCategories.length > 0;

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
          <CategoryFilter
            selectedCategories={selectedCategories}
            onCategoryChange={onCategoryChange}
            vertical={true}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};