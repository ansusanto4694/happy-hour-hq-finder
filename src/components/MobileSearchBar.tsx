import React, { useState } from 'react';
import { Search, MapPin, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TimeDropdown } from './TimeDropdown';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export const MobileSearchBar = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Get current values from URL
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [zipCode, setZipCode] = useState(searchParams.get('zip') || '');
  const [startTime, setStartTime] = useState(searchParams.get('startTime') || '');
  const [endTime, setEndTime] = useState(searchParams.get('endTime') || '');

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (zipCode) params.set('zip', zipCode);
    if (startTime) params.set('startTime', startTime);
    if (endTime) params.set('endTime', endTime);
    
    navigate(`/results?${params.toString()}`);
    setIsExpanded(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const hasFilters = zipCode || startTime || endTime;

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Always visible search input */}
      <div className="flex items-center gap-2 p-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search bars, restaurants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-10 pr-4 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
        
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className={`px-2 ${hasFilters ? 'text-orange-600' : 'text-gray-500'}`}
            >
              <Clock className="w-4 h-4 mr-1" />
              {hasFilters && <div className="w-2 h-2 bg-orange-500 rounded-full" />}
              {isExpanded ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <div className="border-t mt-3 pt-4 space-y-4">
              {/* Time filters */}
              <div className="space-y-3">
                <div className="text-sm font-medium text-gray-700">Time Range</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Start Time</label>
                    <TimeDropdown
                      placeholder="Starting..."
                      value={startTime}
                      onChange={setStartTime}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">End Time</label>
                    <TimeDropdown
                      placeholder="Ending..."
                      value={endTime}
                      onChange={setEndTime}
                    />
                  </div>
                </div>
              </div>
              
              {/* Location */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700">Location</div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Enter zip code"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="pl-10 pr-4 h-10"
                    maxLength={5}
                  />
                </div>
              </div>
              
              {/* Search button */}
              <Button
                onClick={handleSearch}
                className="w-full h-11 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold text-base"
              >
                Search
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
};