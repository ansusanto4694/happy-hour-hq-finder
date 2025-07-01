
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useCategoriesHierarchy } from '@/hooks/useCategories';

interface CategoryFilterProps {
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategories,
  onCategoryChange,
}) => {
  const { getParentCategories, getSubCategories, isLoading } = useCategoriesHierarchy();
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const toggleCategory = (categoryId: string) => {
    const newSelected = selectedCategories.includes(categoryId)
      ? selectedCategories.filter(id => id !== categoryId)
      : [...selectedCategories, categoryId];
    
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Filter by Category</h3>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {parentCategories.map(parent => {
          const subCategories = getSubCategories(parent.id);
          const isExpanded = expandedCategories.includes(parent.id);
          const hasSubCategories = subCategories.length > 0;

          return (
            <div key={parent.id} className="border rounded-lg p-3 bg-white">
              <div className="flex items-center justify-between mb-2">
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
                    className="h-6 w-6 p-0"
                  >
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
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
