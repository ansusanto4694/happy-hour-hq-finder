import React from 'react';
import { Star } from 'lucide-react';

interface GoogleRatingBadgeProps {
  rating: number;
  reviewCount: number;
  googleUrl?: string | null;
  size?: 'sm' | 'md';
}

export const GoogleRatingBadge: React.FC<GoogleRatingBadgeProps> = ({
  rating,
  reviewCount,
  googleUrl,
  size = 'sm',
}) => {
  const content = (
    <div className="flex items-center gap-1">
      <Star
        className={`${
          size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5'
        } fill-amber-400 text-amber-400`}
      />
      <span
        className={`${
          size === 'sm' ? 'text-sm' : 'text-lg'
        } font-semibold text-foreground`}
      >
        {rating.toFixed(1)}
      </span>
      <span
        className={`${
          size === 'sm' ? 'text-xs' : 'text-sm'
        } text-muted-foreground`}
      >
        ({reviewCount})
      </span>
    </div>
  );

  if (googleUrl) {
    return (
      <a
        href={googleUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:opacity-80 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        {content}
      </a>
    );
  }

  return content;
};
