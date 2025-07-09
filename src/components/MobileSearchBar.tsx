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
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search bars, restaurants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-10 pr-4 h-12 text-base border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-gray-50 rounded-lg"
            />
          </div>
          
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className={`px-3 py-3 h-12 rounded-lg ${hasFilters ? 'bg-orange-50 text-orange-600 border border-orange-200' : 'bg-gray-50 text-gray-500 border border-gray-200'}`}
              >
                <Clock className="w-4 h-4" />
                {isExpanded ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <div className="fixed inset-0 bg-white z-50 flex flex-col">
                {/* Header with search bar */}
                <div className="flex-shrink-0 p-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        type="text"
                        placeholder="Search bars, restaurants..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="pl-10 pr-4 h-12 text-base border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-gray-50 rounded-lg"
                      />
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setIsExpanded(false)}
                      className="px-3 py-3 h-12 rounded-lg bg-gray-50 text-gray-500 border border-gray-200"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                  {/* Time filters */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900">When are you going?</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Start Time</label>
                        <TimeDropdown
                          placeholder="Start"
                          value={startTime}
                          onChange={setStartTime}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">End Time</label>
                        <TimeDropdown
                          placeholder="End"
                          value={endTime}
                          onChange={setEndTime}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Location */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900">Where are you looking?</h3>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        type="text"
                        placeholder="Enter zip code"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="pl-10 pr-4 h-12 text-base bg-gray-50 border-gray-200 rounded-lg"
                        maxLength={5}
                      />
                    </div>
                  </div>
                </div>

                {/* Fixed bottom button */}
                <div className="flex-shrink-0 p-4 border-t border-gray-200">
                  <Button
                    onClick={handleSearch}
                    className="w-full h-12 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold text-base rounded-lg shadow-md"
                  >
                    Find Happy Hours
                  </Button>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </div>
  );
};