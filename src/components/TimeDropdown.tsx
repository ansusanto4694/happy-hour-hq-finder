
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TimeDropdownProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  variant?: 'horizontal' | 'vertical';
}

export const TimeDropdown = ({ placeholder, value, onChange, variant = 'horizontal' }: TimeDropdownProps) => {
  const timeOptions = [
    '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
    '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM', '11:00 PM', '12:00 AM', '1:00 AM', '2:00 AM'
  ];

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={`w-full border-0 focus:ring-0 focus:ring-offset-0 rounded-xl ${
        variant === 'vertical' ? 'py-5 text-lg' : 'py-4 text-base'
      }`}>
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
