import React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export type RadiusOption = 'blocks' | 'walking' | 'bike' | 'drive' | 'city';

interface RadiusFilterProps {
  selectedRadius: RadiusOption;
  onRadiusChange: (radius: RadiusOption) => void;
  isEnabled: boolean;
  useGPS?: boolean;
}

export const RadiusFilter: React.FC<RadiusFilterProps> = ({
  selectedRadius,
  onRadiusChange,
  isEnabled,
  useGPS = false
}) => {
  const radiusOptions = [
    { value: 'blocks' as const, label: 'Nearby (within .25 miles)', miles: 0.25 },
    { value: 'walking' as const, label: 'Walking (within 1 mile)', miles: 1 },
    { value: 'bike' as const, label: 'Bike (within 3 miles)', miles: 3 },
    { value: 'drive' as const, label: 'Drive (within 5 miles)', miles: 5 },
    { value: 'city' as const, label: 'City-wide (within 25 miles)', miles: 25 }
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
        {useGPS && (
          <span className="text-xs text-blue-600 font-medium">
            Using GPS location
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
  const radiusMap: Record<RadiusOption, number> = {
    blocks: 0.25,
    walking: 1,
    bike: 3,
    drive: 5,
    city: 25
  };
  
  return radius ? radiusMap[radius] : 1;
};

// Detect ZIP code pattern (5-digit US ZIP)
const isZipCode = (input: string): boolean => /^\d{5}(-\d{4})?$/.test(input.trim());

/**
 * Determine smart default radius based on location type from autocomplete.
 * Only used when the user has NOT explicitly set a radius.
 */
export const getSmartDefaultRadius = (
  locationType: string | null,
  useGPS: boolean
): RadiusOption => {
  // GPS always defaults to walking
  if (useGPS) return 'walking';

  if (!locationType) return 'drive'; // Unknown / manual fallback

  const normalized = locationType.toLowerCase();

  // City-level searches get the widest default
  if (normalized.includes('city') || normalized.includes('place') || normalized.includes('borough')) {
    return 'city';
  }

  // Neighborhood-level is tight
  if (normalized.includes('neighborhood') || normalized.includes('locality')) {
    return 'blocks';
  }

  // ZIP code
  if (normalized.includes('zip') || normalized.includes('postcode')) {
    return 'bike';
  }

  // State / Country → city-wide
  if (normalized.includes('state') || normalized.includes('region') || normalized.includes('country')) {
    return 'city';
  }

  // Fallback for unknown types
  return 'drive';
};

/**
 * Infer location type from raw user input when no suggestion was selected.
 */
export const inferLocationTypeFromInput = (input: string): string | null => {
  if (!input) return null;
  if (isZipCode(input)) return 'ZIP Code';
  return null; // Can't reliably infer further; will fall back to 'drive'
};
