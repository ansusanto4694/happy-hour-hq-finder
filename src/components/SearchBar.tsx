
import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TimeDropdown } from './TimeDropdown';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface LocationSuggestion {
  id: string;
  place_name: string;
  center: [number, number];
  place_type: string[];
  text: string;
  location_type: string;
}

interface SearchBarProps {
  variant?: 'hero' | 'results';
}

export const SearchBar = ({ variant = 'hero' }: SearchBarProps) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Initialize state from URL parameters when available
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [location, setLocation] = useState(searchParams.get('location') || searchParams.get('zip') || '');
  const [startTime, setStartTime] = useState(searchParams.get('startTime') || '');
  const [endTime, setEndTime] = useState(searchParams.get('endTime') || '');
  const [selectedDays, setSelectedDays] = useState<number[]>(() => {
    const daysParam = searchParams.get('days');
    return daysParam ? daysParam.split(',').map(Number) : [];
  });
  
  // Location autocomplete state
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  
  // Refs
  const locationInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Fetch location suggestions
  const fetchLocationSuggestions = async (query: string) => {
    if (query.length < 2) {
      setLocationSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      const { data, error } = await supabase.functions.invoke('location-suggestions', {
        body: { query }
      });

      if (error) throw error;

      setLocationSuggestions(data.suggestions || []);
      setShowSuggestions(true);
      setSelectedSuggestionIndex(-1);
    } catch (error) {
      console.error('Error fetching location suggestions:', error);
      setLocationSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // Handle location input change with debounce
  const handleLocationChange = (value: string) => {
    setLocation(value);
    
    // Clear existing debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    // Debounce the API call
    debounceRef.current = setTimeout(() => {
      fetchLocationSuggestions(value);
    }, 300);
  };

  // Handle suggestion selection
  const selectSuggestion = (suggestion: LocationSuggestion) => {
    setLocation(suggestion.place_name);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    locationInputRef.current?.focus();
  };

  // Handle keyboard navigation
  const handleLocationKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || locationSuggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSearch();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < locationSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : locationSuggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          selectSuggestion(locationSuggestions[selectedSuggestionIndex]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  // Days of week data
  const daysOfWeek = [
    { label: 'Mon', value: 0 },
    { label: 'Tue', value: 1 },
    { label: 'Wed', value: 2 },
    { label: 'Thu', value: 3 },
    { label: 'Fri', value: 4 },
    { label: 'Sat', value: 5 },
    { label: 'Sun', value: 6 }
  ];

  // Handle day selection
  const toggleDay = (dayValue: number) => {
    setSelectedDays(prev => 
      prev.includes(dayValue) 
        ? prev.filter(day => day !== dayValue)
        : [...prev, dayValue]
    );
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !locationInputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleSearch = () => {
    console.log('=== SEARCH BAR DEBUG ===');
    console.log('Searching for:', searchTerm, 'in location:', location, 'start time:', startTime, 'end time:', endTime, 'selected days:', selectedDays);
    console.log('Search term length:', searchTerm.length);
    console.log('Search term trim:', searchTerm.trim());
    console.log('========================');
    
    // Create URL search parameters
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (location) params.set('location', location);
    if (startTime) params.set('startTime', startTime);
    if (endTime) params.set('endTime', endTime);
    if (selectedDays.length > 0) params.set('days', selectedDays.join(','));
    
    // Navigate to results page with parameters
    navigate(`/results?${params.toString()}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className={`w-full ${variant === 'hero' ? 'max-w-2xl' : 'max-w-5xl'} mx-auto`}>
      {variant === 'hero' ? (
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search for bars, restaurants, or cuisines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-12 pr-12 py-4 text-lg border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl bg-gray-50"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          
          {/* Time filters */}
          <div className="grid grid-cols-2 gap-4">
            <TimeDropdown
              placeholder="Starting at..."
              value={startTime}
              onChange={setStartTime}
            />
            <TimeDropdown
              placeholder="Ending at..."
              value={endTime}
              onChange={setEndTime}
            />
          </div>
          
          {/* Day of week filters */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 text-center block">Select days of the week</label>
            <div className="flex justify-center">
              <div className="flex gap-2 justify-center">
                {daysOfWeek.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      selectedDays.includes(day.value)
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Location input with autocomplete */}
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
            <Input
              ref={locationInputRef}
              type="text"
              placeholder="City, State or ZIP"
              value={location}
              onChange={(e) => handleLocationChange(e.target.value)}
              onKeyDown={handleLocationKeyDown}
              className="pl-12 pr-12 py-4 text-lg border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl bg-gray-50"
              autoComplete="off"
            />
            
            {/* Clear button */}
            {location && (
              <button
                onClick={() => {
                  setLocation('');
                  setShowSuggestions(false);
                  setLocationSuggestions([]);
                }}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors z-20"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            
            {/* Loading indicator */}
            {isLoadingSuggestions && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-gray-600"></div>
              </div>
            )}
            
            {/* Suggestions dropdown */}
            {showSuggestions && locationSuggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
              >
                {locationSuggestions.map((suggestion, index) => (
                  <div
                    key={suggestion.id}
                    className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-gray-50 ${
                      index === selectedSuggestionIndex ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                    onClick={() => selectSuggestion(suggestion)}
                  >
                    <div className="flex items-start">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {suggestion.text}
                        </div>
                        <div className="text-xs text-gray-500">
                          {suggestion.place_name}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 ml-2 shrink-0">
                        {suggestion.location_type}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Search button */}
          <Button
            onClick={handleSearch}
            className="w-full py-4 text-lg font-semibold rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Search
          </Button>
        </div>
      ) : (
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
              className="pl-12 pr-12 py-4 text-lg border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>
            )}
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
          
          {/* Day of week filters - compact version for results */}
          <div className="lg:w-64">
            <div className="flex flex-wrap gap-1 p-2">
              {daysOfWeek.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={`px-2 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                    selectedDays.includes(day.value)
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Divider */}
          <div className="hidden lg:block w-px bg-gray-200 my-2"></div>
          
          {/* Location input with autocomplete */}
          <div className="lg:w-48 relative">
            <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
            <Input
              ref={locationInputRef}
              type="text"
              placeholder="City, State or ZIP"
              value={location}
              onChange={(e) => handleLocationChange(e.target.value)}
              onKeyDown={handleLocationKeyDown}
              className="pl-12 pr-12 py-4 text-lg border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl"
              autoComplete="off"
            />
            
            {/* Clear button */}
            {location && (
              <button
                onClick={() => {
                  setLocation('');
                  setShowSuggestions(false);
                  setLocationSuggestions([]);
                }}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors z-20"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            
            {/* Loading indicator */}
            {isLoadingSuggestions && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-gray-600"></div>
              </div>
            )}
            
            {/* Suggestions dropdown */}
            {showSuggestions && locationSuggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
              >
                {locationSuggestions.map((suggestion, index) => (
                  <div
                    key={suggestion.id}
                    className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-gray-50 ${
                      index === selectedSuggestionIndex ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                    onClick={() => selectSuggestion(suggestion)}
                  >
                    <div className="flex items-start">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {suggestion.text}
                        </div>
                        <div className="text-xs text-gray-500">
                          {suggestion.place_name}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 ml-2 shrink-0">
                        {suggestion.location_type}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Search button */}
          <Button
            onClick={handleSearch}
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Search
          </Button>
        </div>
      )}
    </div>
  );
};
