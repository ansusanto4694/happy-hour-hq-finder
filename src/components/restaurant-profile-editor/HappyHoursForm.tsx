
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface HappyHour {
  id: string;
  day_of_week: number;
  happy_hour_start: string;
  happy_hour_end: string;
}

interface HappyHoursFormProps {
  happyHours: HappyHour[];
  onHappyHourChange: (index: number, field: 'happy_hour_start' | 'happy_hour_end', value: string) => void;
  onHappyHourDayChange: (index: number, day: number) => void;
  onAddHappyHour: () => void;
  onRemoveHappyHour: (index: number) => void;
}

const DAYS_OF_WEEK = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

export const HappyHoursForm: React.FC<HappyHoursFormProps> = ({
  happyHours,
  onHappyHourChange,
  onHappyHourDayChange,
  onAddHappyHour,
  onRemoveHappyHour
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Happy Hours</h3>
        <Button type="button" variant="outline" size="sm" onClick={onAddHappyHour}>
          Add Happy Hour
        </Button>
      </div>

      <div className="space-y-3">
        {happyHours.map((hh, index) => (
          <div key={hh.id} className="flex items-center gap-3 p-3 border rounded-lg">
            <select
              value={hh.day_of_week}
              onChange={(e) => onHappyHourDayChange(index, parseInt(e.target.value))}
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {DAYS_OF_WEEK.map((day, dayIndex) => (
                <option key={dayIndex} value={dayIndex}>{day}</option>
              ))}
            </select>
            
            <Input
              type="time"
              value={hh.happy_hour_start}
              onChange={(e) => onHappyHourChange(index, 'happy_hour_start', e.target.value)}
              className="w-32"
            />
            
            <span className="text-gray-500">to</span>
            
            <Input
              type="time"
              value={hh.happy_hour_end}
              onChange={(e) => onHappyHourChange(index, 'happy_hour_end', e.target.value)}
              className="w-32"
            />
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onRemoveHappyHour(index)}
              className="text-red-600 hover:text-red-700"
            >
              Remove
            </Button>
          </div>
        ))}
        
        {happyHours.length === 0 && (
          <p className="text-gray-500 italic text-center py-4">
            No happy hours set. Click "Add Happy Hour" to add some.
          </p>
        )}
      </div>
    </div>
  );
};
