
import React from 'react';

interface HappyHour {
  day_of_week: number;
  happy_hour_start: string;
  happy_hour_end: string;
}

interface RestaurantHappyHoursProps {
  happyHours: HappyHour[];
}

import { getDayName, formatTime } from '@/utils/timeUtils';

export const RestaurantHappyHours: React.FC<RestaurantHappyHoursProps> = ({ happyHours }) => {
  // Sort happy hours by day of week for display
  const sortedHappyHours = happyHours.sort((a, b) => a.day_of_week - b.day_of_week);

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Happy Hours</h2>
      <div className="space-y-1">
        {sortedHappyHours.length > 0 ? (
          sortedHappyHours.map((happyHour) => (
            <div key={happyHour.day_of_week} className="flex justify-between">
              <span className="text-gray-600">{getDayName(happyHour.day_of_week)}:</span>
              <span className="text-gray-700">
                {formatTime(happyHour.happy_hour_start)} - {formatTime(happyHour.happy_hour_end)}
              </span>
            </div>
          ))
        ) : (
          <p className="text-gray-500 italic">No happy hour information available</p>
        )}
      </div>
    </div>
  );
};
