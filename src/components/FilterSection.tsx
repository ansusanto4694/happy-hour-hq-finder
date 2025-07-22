
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadiusFilter, RadiusOption } from './RadiusFilter';

interface FilterSectionProps {
  selectedRadius: RadiusOption;
  onRadiusChange: (radius: RadiusOption) => void;
  isRadiusEnabled: boolean;
}

export const FilterSection: React.FC<FilterSectionProps> = ({
  selectedRadius,
  onRadiusChange,
  isRadiusEnabled
}) => {
  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Filters</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
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
