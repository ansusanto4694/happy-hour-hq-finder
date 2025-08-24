
import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin, ChevronDown, X, LocateFixed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLocateMe } from '@/hooks/useLocateMe';

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
  
  // Location autocomplete state
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const { locate, isLocating } = useLocateMe();
  
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
    // Clear GPS coordinates when manually editing location
    setGpsCoordinates(null);
    
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
    // Clear GPS coordinates when selecting a suggestion (this is not GPS location)
    setGpsCoordinates(null);
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

  // Track GPS coordinates when using locate me
  const [gpsCoordinates, setGpsCoordinates] = useState<{lat: number; lng: number} | null>(null);

  const handleSearch = () => {
    console.log('=== SEARCH BAR DEBUG ===');
    console.log('Searching for:', searchTerm, 'in location:', location);
    console.log('GPS coordinates:', gpsCoordinates);
    console.log('Search term length:', searchTerm.length);
    console.log('Search term trim:', searchTerm.trim());
    console.log('========================');
    
    // Create URL search parameters
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (location) params.set('location', location);
    
    // If we have GPS coordinates from locate me, include them
    if (gpsCoordinates) {
      params.set('lat', gpsCoordinates.lat.toString());
      params.set('lng', gpsCoordinates.lng.toString());
      params.set('useGPS', 'true');
    }
    
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
              className="pl-12 pr-12 py-4 text-sm border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl bg-gray-50"
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
              className="pl-12 pr-12 py-4 text-sm border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl bg-gray-50"
              autoComplete="off"
            />
            {/* Locate me button */}
            <button
              type="button"
              aria-label="Use my location"
              onClick={async () => {
                const r = await locate();
                if (r?.display) {
                  setLocation(r.display);
                  setShowSuggestions(false);
                  // Store GPS coordinates for search
                  if (r.latitude && r.longitude) {
                    setGpsCoordinates({ lat: r.latitude, lng: r.longitude });
                  }
                }
              }}
              className="absolute right-12 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors z-20 w-11 h-11 flex items-center justify-center"
            >
              {isLocating ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
              ) : (
                <LocateFixed className="w-5 h-5" />
              )}
            </button>
            
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
          
          {/* Location input with autocomplete */}
          <div className="flex-1 lg:flex-1 relative">
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
            {/* Locate me button */}
            <button
              type="button"
              aria-label="Use my location"
              onClick={async () => {
                const r = await locate();
                if (r?.display) {
                  setLocation(r.display);
                  setShowSuggestions(false);
                  // Store GPS coordinates for search
                  if (r.latitude && r.longitude) {
                    setGpsCoordinates({ lat: r.latitude, lng: r.longitude });
                  }
                }
              }}
              className="absolute right-12 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors z-20 w-11 h-11 flex items-center justify-center"
            >
              {isLocating ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
              ) : (
                <LocateFixed className="w-5 h-5" />
              )}
            </button>
            
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
