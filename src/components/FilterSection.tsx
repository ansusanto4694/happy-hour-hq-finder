
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadiusFilter, RadiusOption } from './RadiusFilter';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface FilterSectionProps {
  selectedRadius: RadiusOption;
  onRadiusChange: (radius: RadiusOption) => void;
  isRadiusEnabled: boolean;
  showOffersOnly: boolean;
  onShowOffersChange: (showOffers: boolean) => void;
}

export const FilterSection: React.FC<FilterSectionProps> = ({
  selectedRadius,
  onRadiusChange,
  isRadiusEnabled,
  showOffersOnly,
  onShowOffersChange
}) => {
  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Filters</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
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
          
          <RadiusFilter
            selectedRadius={selectedRadius}
            onRadiusChange={onRadiusChange}
            isEnabled={isRadiusEnabled}
          />
        </div>
      </CardContent>
    </Card>
  );
};
