
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useCategoriesHierarchy } from '@/hooks/useCategories';

interface CategoryFilterProps {
  selectedCategories: string[]; // Changed to string array
  onCategoryChange: (categories: string[]) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategories,
  onCategoryChange,
}) => {
  const { getParentCategories, getSubCategories, isLoading } = useCategoriesHierarchy();
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const toggleCategory = (categoryId: string) => {
    console.log('Toggling category:', categoryId);
    console.log('Current selected categories:', selectedCategories);
    
    const newSelected = selectedCategories.includes(categoryId)
      ? selectedCategories.filter(id => id !== categoryId)
      : [...selectedCategories, categoryId];
    
    console.log('New selected categories:', newSelected);
    onCategoryChange(newSelected);
  };

  const toggleExpanded = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const clearAllFilters = () => {
    onCategoryChange([]);
  };

  if (isLoading) {
    return <div className="text-sm text-gray-500">Loading categories...</div>;
  }

  const parentCategories = getParentCategories();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center h-8">
          <h3 className="font-semibold text-base">Filter by Category</h3>
        </div>
        {selectedCategories.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearAllFilters}>
            Clear All
          </Button>
        )}
      </div>

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

      {/* Responsive grid layout - vertical on large screens (sidebar), horizontal on small screens (top) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-1 gap-3">
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
                    onClick={() => toggleExpanded(parent.id)}
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
    </div>
  );
};
