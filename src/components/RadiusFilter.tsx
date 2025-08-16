import React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export type RadiusOption = 'blocks' | 'walking' | 'bike' | 'drive';

interface RadiusFilterProps {
  selectedRadius: RadiusOption;
  onRadiusChange: (radius: RadiusOption) => void;
  isEnabled: boolean;
}

export const RadiusFilter: React.FC<RadiusFilterProps> = ({
  selectedRadius,
  onRadiusChange,
  isEnabled
}) => {
  const radiusOptions = [
    { value: 'blocks' as const, label: 'Nearby (within .25 miles)', miles: 0.25 },
    { value: 'walking' as const, label: 'Walking (within 1 mile)', miles: 1 },
    { value: 'bike' as const, label: 'Bike (within 3 miles)', miles: 3 },
    { value: 'drive' as const, label: 'Drive (within 5 miles)', miles: 5 }
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          Distance from location
        </Label>
        {!isEnabled && (
          <span className="text-xs text-gray-400">
            Enter a location to enable
          </span>
        )}
      </div>
      
      <RadioGroup
        value={selectedRadius || 'walking'}
        onValueChange={(value) => onRadiusChange(value as RadiusOption)}
        disabled={!isEnabled}
        className="space-y-2"
      >
        {radiusOptions.map((option) => (
          <div key={option.value} className="flex items-center space-x-2">
            <RadioGroupItem 
              value={option.value} 
              id={option.value}
              disabled={!isEnabled}
            />
            <Label 
              htmlFor={option.value}
              className={`text-sm cursor-pointer ${
                !isEnabled ? 'text-gray-400' : 'text-gray-700'
              }`}
            >
              {option.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
};

// Helper function to get miles from radius option
export const getRadiusMiles = (radius: RadiusOption | null): number => {
  const radiusMap = {
    blocks: 0.25,
    walking: 1,
    bike: 3,
    drive: 5
  };
  
  return radius ? radiusMap[radius] : 1; // Default to walking distance if no radius selected
};