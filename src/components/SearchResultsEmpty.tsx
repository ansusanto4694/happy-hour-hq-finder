
import React from 'react';

interface SearchResultsEmptyProps {
  startTime?: string;
  endTime?: string;
  location?: string;
}

export const SearchResultsEmpty: React.FC<SearchResultsEmptyProps> = ({ 
  startTime, 
  endTime, 
  location 
}) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-foreground">We aren't in your neighborhood yet!</h2>
      <p className="text-muted-foreground">
        Reach out to{' '}
        <a 
          href="mailto:andrew@sipmunchyap.com" 
          className="text-primary underline hover:text-primary/80"
        >
          andrew@sipmunchyap.com
        </a>{' '}
        and let me know where you're coming from so I can add in your neighborhood.
      </p>
    </div>
  );
};
