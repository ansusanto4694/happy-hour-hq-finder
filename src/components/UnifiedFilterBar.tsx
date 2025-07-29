import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useCategoriesHierarchy } from '@/hooks/useCategories';
import { RadiusOption } from './RadiusFilter';

interface UnifiedFilterBarProps {
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
  selectedRadius: RadiusOption;
  onRadiusChange: (radius: RadiusOption) => void;
  isRadiusEnabled: boolean;
  showOffersOnly: boolean;
  onShowOffersChange: (showOffers: boolean) => void;
  vertical?: boolean;
}

const RADIUS_OPTIONS: { value: RadiusOption; label: string; disabled?: boolean }[] = [
  { value: 'blocks', label: 'Within 5 blocks' },
  { value: 'walking', label: 'Walking (within 1 mile)' },
  { value: 'bike', label: 'Bike (within 3 miles)' },
  { value: 'drive', label: 'Drive (within 5 miles)' },
];

export const UnifiedFilterBar: React.FC<UnifiedFilterBarProps> = ({
  selectedCategories,
  onCategoryChange,
  selectedRadius,
  onRadiusChange,
  isRadiusEnabled,
  showOffersOnly,
  onShowOffersChange,
  vertical = false,
}) => {
  const { getParentCategories, getSubCategories, isLoading } = useCategoriesHierarchy();
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [isDistanceExpanded, setIsDistanceExpanded] = useState(false);

  const toggleCategory = (categoryId: string) => {
    console.log('Toggling category:', categoryId);
    console.log('Current selected categories:', selectedCategories);
    
    const newSelected = selectedCategories.includes(categoryId)
      ? selectedCategories.filter(id => id !== categoryId)
      : [...selectedCategories, categoryId];
    
    console.log('New selected categories:', newSelected);
    onCategoryChange(newSelected);
  };

  const toggleCategoryExpanded = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const clearAllFilters = () => {
    onCategoryChange([]);
    onRadiusChange('walking');
    onShowOffersChange(false);
  };

  if (isLoading) {
    return <div className="text-sm text-gray-500">Loading filters...</div>;
  }

  const parentCategories = getParentCategories();
  const hasAnyFilters = selectedCategories.length > 0 || selectedRadius !== 'walking' || showOffersOnly;

  return (
    <Card className="h-fit">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Filters</CardTitle>
          {hasAnyFilters && (
            <Button variant="outline" size="sm" onClick={clearAllFilters}>
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Show offers only toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="offers-toggle" className="text-sm font-medium">
              Show offers only
            </Label>
            <Switch
              id="offers-toggle"
              checked={showOffersOnly}
              onCheckedChange={onShowOffersChange}
            />
          </div>

          {/* Selected categories badges */}
          {selectedCategories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedCategories.map(categoryId => {
                const category = [...parentCategories, ...parentCategories.flatMap(p => getSubCategories(p.id))]
                  .find(c => c.id === categoryId);
                return category ? (
                  <Badge key={categoryId} variant="secondary" className="cursor-pointer" 
                    onClick={() => toggleCategory(categoryId)}>
                    {category.name} ×
                  </Badge>
                ) : null;
              })}
            </div>
          )}

          {/* Categories section */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Categories</h4>
            <ScrollArea className="h-[300px]">
              <div className={vertical ? "space-y-3" : "grid grid-cols-1 gap-3"}>
                {parentCategories.map(parent => {
                  const subCategories = getSubCategories(parent.id);
                  const isExpanded = expandedCategories.includes(parent.id);
                  const hasSubCategories = subCategories.length > 0;

                  return (
                    <div key={parent.id} className="border rounded-lg p-2 bg-white">
                      <div className="flex items-center justify-between mb-1">
                        <label className="flex items-center space-x-2 cursor-pointer flex-1">
                          <input
                            type="checkbox"
                            checked={selectedCategories.includes(parent.id)}
                            onChange={() => toggleCategory(parent.id)}
                            className="rounded"
                          />
                          <span className="font-medium text-sm">{parent.name}</span>
                        </label>
                        
                        {hasSubCategories && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleCategoryExpanded(parent.id)}
                            className="h-5 w-5 p-0"
                          >
                            {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                          </Button>
                        )}
                      </div>

                      {hasSubCategories && (
                        <Collapsible open={isExpanded}>
                          <CollapsibleContent className="space-y-1">
                            {subCategories.map(sub => (
                              <label key={sub.id} className="flex items-center space-x-2 cursor-pointer pl-2">
                                <input
                                  type="checkbox"
                                  checked={selectedCategories.includes(sub.id)}
                                  onChange={() => toggleCategory(sub.id)}
                                  className="rounded"
                                />
                                <span className="text-xs">{sub.name}</span>
                              </label>
                            ))}
                          </CollapsibleContent>
                        </Collapsible>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Distance filter */}
          <div className="space-y-3">
            <div className="border rounded-lg p-2 bg-white">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-medium text-sm">Distance</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsDistanceExpanded(!isDistanceExpanded)}
                  className="h-5 w-5 p-0"
                >
                  {isDistanceExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </Button>
              </div>

              <Collapsible open={isDistanceExpanded}>
                <CollapsibleContent className="space-y-2">
                  {!isRadiusEnabled && (
                    <p className="text-xs text-gray-500 mb-2">
                      Distance filtering requires a location to be specified in your search.
                    </p>
                  )}
                  
                  <div className="space-y-2">
                    {RADIUS_OPTIONS.map((option) => (
                      <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="radius"
                          value={option.value}
                          checked={selectedRadius === option.value}
                          onChange={() => onRadiusChange(option.value)}
                          disabled={!isRadiusEnabled}
                          className="rounded-full"
                        />
                        <span className={`text-xs ${!isRadiusEnabled ? 'text-gray-400' : ''}`}>
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};