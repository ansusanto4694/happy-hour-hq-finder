import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface ReviewTextEditorProps {
  value: string;
  onChange: (text: string) => void;
  disabled?: boolean;
  minLength?: number;
  maxLength?: number;
}

export const ReviewTextEditor: React.FC<ReviewTextEditorProps> = ({
  value,
  onChange,
  disabled = false,
  minLength = 50,
  maxLength = 2000,
}) => {
  const charCount = value.length;
  const isUnderMin = charCount > 0 && charCount < minLength;
  const isNearMax = charCount > maxLength * 0.9;

  return (
    <div className="space-y-2">
      <Label htmlFor="review-text" className="text-base font-semibold">
        Your Review <span className="text-destructive">*</span>
      </Label>
      <p className="text-sm text-muted-foreground">
        Share your experience with this restaurant's happy hour
      </p>
      <Textarea
        id="review-text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Tell others about your experience. What did you enjoy? Was the happy hour worth it? How was the food and atmosphere?"
        className="min-h-[150px] resize-y"
        maxLength={maxLength}
      />
      <div className="flex justify-between items-center text-sm">
        <span className={cn(
          "text-muted-foreground",
          isUnderMin && "text-amber-500"
        )}>
          {isUnderMin && `Minimum ${minLength} characters recommended`}
        </span>
        <span className={cn(
          "text-muted-foreground",
          isNearMax && "text-amber-500"
        )}>
          {charCount}/{maxLength}
        </span>
      </div>
    </div>
  );
};
