
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Search, MapPin, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TimeDropdown } from './TimeDropdown';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDebounce } from '@/hooks/usePerformanceOptimizations';
import { supabase } from '@/integrations/supabase/client';

interface LocationSuggestion {
  id: string;
  place_name: string;
  place_type: string[];
  center: [number, number];
}

interface SearchBarProps {
  variant?: 'horizontal' | 'vertical';
}

export const SearchBar = ({ variant = 'horizontal' }: SearchBarProps) => {
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
  const locationInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Memoized search handler to prevent unnecessary re-renders
  const handleSearch = useCallback(() => {
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
  }, [searchTerm, location, startTime, endTime, navigate]);

  // Fetch location suggestions
  const fetchLocationSuggestions = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setLocationSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      const { data, error } = await supabase.functions.invoke('location-suggestions', {
        body: { query: query.trim() }
      });

      if (error) {
        console.error('Error fetching location suggestions:', error);
        setLocationSuggestions([]);
      } else {
        setLocationSuggestions(data?.suggestions || []);
        setShowSuggestions(true);
        setSelectedSuggestionIndex(-1);
      }
    } catch (error) {
      console.error('Error fetching location suggestions:', error);
      setLocationSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, []);

  // Debounced suggestion fetch
  const { debouncedCallback: debouncedFetchSuggestions } = useDebounce(fetchLocationSuggestions, 300);

  // Debounced search for auto-search functionality (optional future enhancement)
  const { debouncedCallback: debouncedSearch } = useDebounce(handleSearch, 500);

  // Memoized key press handler
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  // Memoized input change handlers to prevent unnecessary re-renders
  const handleSearchTermChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleLocationChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocation(value);
    debouncedFetchSuggestions(value);
  }, [debouncedFetchSuggestions]);

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback((suggestion: LocationSuggestion) => {
    setLocation(suggestion.place_name);
    setShowSuggestions(false);
    setLocationSuggestions([]);
    locationInputRef.current?.focus();
  }, []);

  // Handle keyboard navigation in suggestions
  const handleLocationKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
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
          prev < locationSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          handleSuggestionSelect(locationSuggestions[selectedSuggestionIndex]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  }, [showSuggestions, locationSuggestions, selectedSuggestionIndex, handleSuggestionSelect, handleSearch]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node) &&
          locationInputRef.current && !locationInputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Memoized dropdown change handlers
  const handleStartTimeChange = useCallback((value: string) => {
    setStartTime(value);
  }, []);

  const handleEndTimeChange = useCallback((value: string) => {
    setEndTime(value);
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className={`bg-white rounded-2xl shadow-lg p-2 ${
        variant === 'vertical' 
          ? 'flex flex-col gap-2' 
          : 'flex flex-col lg:flex-row gap-2'
      }`}>
        {/* Search input */}
        <div className={variant === 'vertical' ? 'w-full' : 'flex-1 relative'}>
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search for bars, restaurants, or cuisines..."
            value={searchTerm}
            onChange={handleSearchTermChange}
            onKeyPress={handleKeyPress}
            className="pl-12 pr-4 py-4 text-lg border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl"
          />
        </div>
        
        {/* Time inputs container */}
        <div className={`${
          variant === 'vertical' 
            ? 'flex gap-2' 
            : 'contents'
        }`}>
          {/* Divider for horizontal layout */}
          {variant === 'horizontal' && <div className="hidden lg:block w-px bg-gray-200 my-2"></div>}
          
          {/* Starting time dropdown */}
          <div className="lg:w-40">
            <TimeDropdown
              placeholder="Starting at..."
              value={startTime}
              onChange={handleStartTimeChange}
            />
          </div>
          
          {/* Divider for horizontal layout */}
          {variant === 'horizontal' && <div className="hidden lg:block w-px bg-gray-200 my-2"></div>}
          
          {/* Ending time dropdown */}
          <div className="lg:w-40">
            <TimeDropdown
              placeholder="Ending at..."
              value={endTime}
              onChange={handleEndTimeChange}
            />
          </div>
        </div>
        
        {/* Divider for horizontal layout */}
        {variant === 'horizontal' && <div className="hidden lg:block w-px bg-gray-200 my-2"></div>}
        
        {/* Location input with autocomplete */}
        <div className={variant === 'vertical' ? 'w-full relative' : 'lg:w-64 relative'}>
          <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
          <Input
            ref={locationInputRef}
            type="text"
            placeholder="City, State or ZIP"
            value={location}
            onChange={handleLocationChange}
            onKeyDown={handleLocationKeyDown}
            className="pl-12 pr-4 py-4 text-lg border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl"
            autoComplete="off"
          />
          
          {/* Suggestions dropdown */}
          {showSuggestions && (locationSuggestions.length > 0 || isLoadingSuggestions) && (
            <div 
              ref={suggestionsRef}
              className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
            >
              {isLoadingSuggestions ? (
                <div className="px-4 py-3 text-sm text-gray-500">
                  Searching locations...
                </div>
              ) : (
                locationSuggestions.map((suggestion, index) => (
                  <div
                    key={suggestion.id}
                    className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors ${
                      index === selectedSuggestionIndex ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                    onClick={() => handleSuggestionSelect(suggestion)}
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {suggestion.place_name}
                        </div>
                        <div className="text-xs text-gray-500 capitalize">
                          {suggestion.place_type.join(', ')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        
        {/* Search button */}
        <Button
          onClick={handleSearch}
          className={`bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl ${
            variant === 'vertical' ? 'w-full' : ''
          }`}
        >
          Search
        </Button>
      </div>
    </div>
  );
};
