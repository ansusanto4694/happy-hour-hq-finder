
import React, { useState } from 'react';
import { Search, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TimeDropdown } from './TimeDropdown';
import { useNavigate, useSearchParams } from 'react-router-dom';

export const SearchBar = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Initialize state from URL parameters when available
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [location, setLocation] = useState(searchParams.get('location') || searchParams.get('zip') || '');
  const [startTime, setStartTime] = useState(searchParams.get('startTime') || '');
  const [endTime, setEndTime] = useState(searchParams.get('endTime') || '');

  const handleSearch = () => {
    console.log('Searching for:', searchTerm, 'in location:', location, 'start time:', startTime, 'end time:', endTime);
    
    // Create URL search parameters
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (location) params.set('location', location);
    if (startTime) params.set('startTime', startTime);
    if (endTime) params.set('endTime', endTime);
    
    // Navigate to results page with parameters
    navigate(`/results?${params.toString()}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-2 flex flex-col lg:flex-row gap-2">
        {/* Search input */}
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search for bars, restaurants, or cuisines..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-12 pr-4 py-4 text-lg border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl"
          />
        </div>
        
        {/* Divider */}
        <div className="hidden lg:block w-px bg-gray-200 my-2"></div>
        
        {/* Starting time dropdown */}
        <div className="lg:w-40">
          <TimeDropdown
            placeholder="Starting at..."
            value={startTime}
            onChange={setStartTime}
          />
        </div>
        
        {/* Divider */}
        <div className="hidden lg:block w-px bg-gray-200 my-2"></div>
        
        {/* Ending time dropdown */}
        <div className="lg:w-40">
          <TimeDropdown
            placeholder="Ending at..."
            value={endTime}
            onChange={setEndTime}
          />
        </div>
        
        {/* Divider */}
        <div className="hidden lg:block w-px bg-gray-200 my-2"></div>
        
        {/* Location input */}
        <div className="lg:w-48 relative">
          <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="City, State or ZIP"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-12 pr-4 py-4 text-lg border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl"
          />
        </div>
        
        {/* Search button */}
        <Button
          onClick={handleSearch}
          className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          Search
        </Button>
      </div>
    </div>
  );
};
