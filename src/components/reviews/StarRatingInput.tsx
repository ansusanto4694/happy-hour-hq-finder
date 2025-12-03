import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const RATING_LABELS = ['Poor', 'Bad', 'Okay', 'Good', 'Fantastic'] as const;

interface StarRatingInputProps {
  value: number | null;
  onChange: (rating: number | null) => void;
  disabled?: boolean;
}

export const StarRatingInput: React.FC<StarRatingInputProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const [hoverRating, setHoverRating] = React.useState<number | null>(null);

  const displayRating = hoverRating ?? value;

  const handleClick = (rating: number) => {
    if (disabled) return;
    // Toggle off if clicking same rating
    onChange(value === rating ? null : rating);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            disabled={disabled}
            onClick={() => handleClick(rating)}
            onMouseEnter={() => !disabled && setHoverRating(rating)}
            onMouseLeave={() => setHoverRating(null)}
            className={cn(
              "p-1 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary/50 rounded",
              disabled && "cursor-not-allowed opacity-50"
            )}
            aria-label={`Rate ${rating} out of 5 - ${RATING_LABELS[rating - 1]}`}
          >
            <Star
              className={cn(
                "h-7 w-7 transition-colors",
                displayRating && rating <= displayRating
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-transparent text-muted-foreground/40"
              )}
            />
          </button>
        ))}
      </div>
      <span className="text-sm text-muted-foreground h-5">
        {displayRating ? RATING_LABELS[displayRating - 1] : 'Click to rate'}
      </span>
    </div>
  );
};
