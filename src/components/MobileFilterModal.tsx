import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { useCategoriesHierarchy } from '@/hooks/useCategories';
import { RadiusOption } from './RadiusFilter';

interface MobileFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
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

const RADIUS_OPTIONS: { value: RadiusOption; label: string }[] = [
  { value: 'blocks', label: 'Within 5 blocks' },
  { value: 'walking', label: 'Walking (within 1 mile)' },
  { value: 'bike', label: 'Bike (within 3 miles)' },
  { value: 'drive', label: 'Drive (within 5 miles)' },
];

const DAYS_OF_WEEK = [
  { label: 'Monday', value: 0 },
  { label: 'Tuesday', value: 1 },
  { label: 'Wednesday', value: 2 },
  { label: 'Thursday', value: 3 },
  { label: 'Friday', value: 4 },
  { label: 'Saturday', value: 5 },
  { label: 'Sunday', value: 6 }
];

export const MobileFilterModal: React.FC<MobileFilterModalProps> = ({
  isOpen,
  onClose,
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
  const { getParentCategories, getSubCategories, isLoading } = useCategoriesHierarchy();

  const toggleCategory = (categoryId: string) => {
    const newSelected = selectedCategories.includes(categoryId)
      ? selectedCategories.filter(id => id !== categoryId)
      : [...selectedCategories, categoryId];
    onCategoryChange(newSelected);
  };

  const toggleDay = (dayValue: number) => {
    const newSelected = selectedDays.includes(dayValue) 
      ? selectedDays.filter(day => day !== dayValue)
      : [...selectedDays, dayValue];
    onDaysChange(newSelected);
  };

  const clearAllFilters = () => {
    onCategoryChange([]);
    onRadiusChange('walking');
    onShowOffersChange(false);
    onDaysChange([]);
  };

  if (!isOpen) return null;

  const parentCategories = getParentCategories();
  const hasAnyFilters = selectedCategories.length > 0 || selectedRadius !== 'walking' || showOffersOnly || selectedDays.length > 0;

  return (
    <div className="fixed inset-0 z-[200] bg-background flex flex-col mobile-filter-modal">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onClose}
          className="p-2"
        >
          <X className="h-5 w-5" />
        </Button>
        <h2 className="text-lg font-semibold">Filters</h2>
        {hasAnyFilters && (
          <Button variant="outline" size="sm" onClick={clearAllFilters}>
            Clear All
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Show offers only toggle */}
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <Label htmlFor="offers-toggle" className="text-base font-medium">
              Show offers only
            </Label>
            <Switch
              id="offers-toggle"
              checked={showOffersOnly}
              onCheckedChange={onShowOffersChange}
            />
          </div>
        </div>

        {/* Categories section */}
        <div className="space-y-3">
          <h3 className="text-base font-semibold">Categories</h3>
          
          {/* Bar category */}
          <div className="border rounded-lg p-3 bg-card">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedCategories.some(id => {
                  const category = parentCategories.find(p => p.id === id);
                  return category?.name === 'Bar';
                })}
                onChange={() => {
                  const barCategory = parentCategories.find(p => p.name === 'Bar');
                  if (barCategory) toggleCategory(barCategory.id);
                }}
                className="w-5 h-5 rounded"
              />
              <span className="text-base">Bar</span>
              <div className="ml-auto">
                <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </label>
          </div>

          {/* Restaurant category */}
          <div className="border rounded-lg p-3 bg-card">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedCategories.some(id => {
                  const category = parentCategories.find(p => p.id === id);
                  return category?.name === 'Restaurant';
                })}
                onChange={() => {
                  const restaurantCategory = parentCategories.find(p => p.name === 'Restaurant');
                  if (restaurantCategory) toggleCategory(restaurantCategory.id);
                }}
                className="w-5 h-5 rounded"
              />
              <span className="text-base">Restaurant</span>
              <div className="ml-auto">
                <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </label>
          </div>
        </div>

        {/* Days of the week */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">Days of the week</h3>
            <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          
          <div className="space-y-2">
            {DAYS_OF_WEEK.map((day) => (
              <label key={day.value} className="flex items-center space-x-3 cursor-pointer py-2">
                <input
                  type="checkbox"
                  checked={selectedDays.includes(day.value)}
                  onChange={() => toggleDay(day.value)}
                  className="w-5 h-5 rounded"
                />
                <span className="text-base">{day.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Distance */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">Distance</h3>
            <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          
          {!isRadiusEnabled && (
            <p className="text-sm text-muted-foreground">
              Distance filtering requires a location to be specified in your search.
            </p>
          )}
          
          <div className="space-y-2">
            {RADIUS_OPTIONS.map((option) => (
              <label key={option.value} className="flex items-center space-x-3 cursor-pointer py-2">
                <input
                  type="radio"
                  name="radius"
                  value={option.value}
                  checked={selectedRadius === option.value}
                  onChange={() => onRadiusChange(option.value)}
                  disabled={!isRadiusEnabled}
                  className="w-5 h-5"
                />
                <span className={`text-base ${!isRadiusEnabled ? 'text-muted-foreground' : ''}`}>
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};