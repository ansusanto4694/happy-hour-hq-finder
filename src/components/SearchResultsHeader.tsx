import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarDays } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from
'@/components/ui/select';

interface SearchResultsHeaderProps {
  resultsCount: number;
  startTime?: string;
  endTime?: string;
  location?: string;
  currentPage?: number;
  totalPages?: number;
  resultsPerPage?: number;
  searchTerm?: string;
  isMobile?: boolean;
  happeningNow?: boolean;
  happeningToday?: boolean;
  sortBy?: string;
  onSortChange?: (value: string) => void;
}

export const SearchResultsHeader: React.FC<SearchResultsHeaderProps> = ({
  resultsCount,
  startTime,
  endTime,
  location,
  currentPage = 1,
  totalPages = 1,
  resultsPerPage = 20,
  searchTerm,
  isMobile = false,
  happeningNow = false,
  happeningToday = false,
  sortBy = 'default',
  onSortChange
}) => {
  const startResult = (currentPage - 1) * resultsPerPage + 1;
  const endResult = Math.min(currentPage * resultsPerPage, resultsCount);

  const formatTime = (time?: string) => {
    if (!time) return '';
    if (time.toUpperCase().includes('AM') || time.toUpperCase().includes('PM')) {
      return time;
    }
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <Card>
      <CardContent className="p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Happy Hour Results
              {searchTerm && <span className="text-primary"> for "{searchTerm}"</span>}
            </h2>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>
                {isMobile ?
                `${resultsCount} restaurants found` :
                `Showing ${startResult}-${endResult} of ${resultsCount} restaurants${totalPages > 1 ? ` (Page ${currentPage} of ${totalPages})` : ''}`
                }
              </p>
              {(happeningNow || happeningToday || startTime || endTime || location || searchTerm) &&
              <div className="flex flex-wrap gap-4 text-xs">
                  {searchTerm &&
                <span>Search: "{searchTerm}"</span>
                }
                  {happeningNow ?
                <span className="inline-flex items-center gap-1.5 font-medium text-primary">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                      Happening Now
                    </span> :
                happeningToday ?
                <span className="inline-flex items-center gap-1.5 font-medium text-blue-600">
                      <CalendarDays className="h-3.5 w-3.5" />
                      Happening Today
                    </span> :
                startTime && endTime ?
                <span>Time: {formatTime(startTime)} - {formatTime(endTime)}</span> :
                null}
                  {location &&
                <span>Location: {location}</span>
                }
                </div>
              }
            </div>
          </div>
          {!isMobile && onSortChange &&
          <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-sm font-medium whitespace-nowrap text-primary">Sort By</span>
              <Select value={sortBy} onValueChange={onSortChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="highest_rated">Highest Rated</SelectItem>
                  <SelectItem value="most_reviewed">Most Reviewed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          }
        </div>
      </CardContent>
    </Card>);

};