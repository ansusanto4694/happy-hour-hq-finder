
import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin, ChevronDown } from 'lucide-react';
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

export const SearchBar = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Initialize state from URL parameters when available
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [location, setLocation] = useState(searchParams.get('location') || searchParams.get('zip') || '');
  const [startTime, setStartTime] = useState(searchParams.get('startTime') || '');
  const [endTime, setEndTime] = useState(searchParams.get('endTime') || '');
  
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
    console.log('Searching for:', searchTerm, 'in location:', location, 'start time:', startTime, 'end time:', endTime);
    console.log('Search term length:', searchTerm.length);
    console.log('Search term trim:', searchTerm.trim());
    console.log('========================');
    
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
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
        {/* Search input */}
        <div className="space-y-3">
          <label className="text-lg font-semibold text-gray-900">What are you looking for?</label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search for bars, restaurants, or cuisines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-12 pr-4 py-4 text-lg border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl bg-gray-50"
            />
          </div>
        </div>
        
        {/* Time filters */}
        <div className="space-y-3">
          <label className="text-lg font-semibold text-gray-900">When are you going?</label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Start Time</label>
              <TimeDropdown
                placeholder="Starting at..."
                value={startTime}
                onChange={setStartTime}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">End Time</label>
              <TimeDropdown
                placeholder="Ending at..."
                value={endTime}
                onChange={setEndTime}
              />
            </div>
          </div>
        </div>
        
        {/* Location input with autocomplete */}
        <div className="space-y-3">
          <label className="text-lg font-semibold text-gray-900">Where are you looking?</label>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
            <Input
              ref={locationInputRef}
              type="text"
              placeholder="City, State or ZIP"
              value={location}
              onChange={(e) => handleLocationChange(e.target.value)}
              onKeyDown={handleLocationKeyDown}
              className="pl-12 pr-4 py-4 text-lg border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl bg-gray-50"
              autoComplete="off"
            />
            
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
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {suggestion.text}
                        </div>
                        <div className="text-xs text-gray-500">
                          {suggestion.place_name}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 ml-2">
                        {suggestion.location_type}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Search button */}
        <Button
          onClick={handleSearch}
          className="w-full py-4 text-lg font-semibold rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          Find Happy Hours
        </Button>
      </div>
    </div>
  );
};
