import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StarRatingInput } from './StarRatingInput';

interface RatingDimensionCardProps {
  title: string;
  description: string;
  value: number | null;
  onChange: (rating: number | null) => void;
  disabled?: boolean;
}

export const RatingDimensionCard: React.FC<RatingDimensionCardProps> = ({
  title,
  description,
  value,
  onChange,
  disabled = false,
}) => {
  return (
    <Card className="bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent>
        <StarRatingInput value={value} onChange={onChange} disabled={disabled} />
      </CardContent>
    </Card>
  );
};
