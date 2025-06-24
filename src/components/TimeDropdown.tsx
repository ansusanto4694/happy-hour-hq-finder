
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TimeDropdownProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

export const TimeDropdown = ({ placeholder, value, onChange }: TimeDropdownProps) => {
  const timeOptions = [
    '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
    '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM', '11:00 PM'
  ];

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full py-4 text-lg border-0 focus:ring-0 focus:ring-offset-0 rounded-xl">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-xl z-50">
        {timeOptions.map((time) => (
          <SelectItem key={time} value={time} className="hover:bg-gray-100">
            {time}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
