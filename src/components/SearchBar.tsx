
import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin, ChevronDown, X, LocateFixed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLocateMe } from '@/hooks/useLocateMe';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useSearchSuggestions } from '@/hooks/useSearchSuggestions';
import { locationCache } from '@/utils/locationCache';

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
  const { track, trackFunnel } = useAnalytics();
  
  // Initialize state from URL parameters when available
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [location, setLocation] = useState(searchParams.get('location') || searchParams.get('zip') || '');
  
  // Location autocomplete state
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [selectedLocationIndex, setSelectedLocationIndex] = useState(-1);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const { locate, isLocating } = useLocateMe();
  
  // Search term autocomplete state
  const { suggestions: searchSuggestions } = useSearchSuggestions({ query: searchTerm, maxResults: 7 });
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(-1);
  
  // Refs
  const locationInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const locationSuggestionsRef = useRef<HTMLDivElement>(null);
  const searchSuggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  const searchDebounceRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch location suggestions
  const fetchLocationSuggestions = async (query: string) => {
    if (query.length < 2) {
      setLocationSuggestions([]);
      setShowLocationSuggestions(false);
      return;
    }

    // Check cache first
    const cachedSuggestions = locationCache.get(query);
    if (cachedSuggestions) {
      setLocationSuggestions(cachedSuggestions);
      setShowLocationSuggestions(true);
      setSelectedLocationIndex(-1);
      setIsLoadingSuggestions(false);
      return;
    }

    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoadingSuggestions(true);
    try {
      const { data, error } = await supabase.functions.invoke('location-suggestions', {
        body: { query }
      });

      // Check if this request was aborted
      if (controller.signal.aborted) {
        return;
      }

      if (error) throw error;

      const suggestions = data.suggestions || [];
      
      // Cache the results
      locationCache.set(query, suggestions);
      
      setLocationSuggestions(suggestions);
      setShowLocationSuggestions(true);
      setSelectedLocationIndex(-1);
      
      // Track suggestions displayed
      track({
        eventType: 'interaction',
        eventCategory: 'search',
        eventAction: 'location_suggestions_displayed',
        eventLabel: query,
        metadata: { suggestionCount: suggestions.length }
      });
    } catch (error: any) {
      // Check if aborted before handling error
      if (controller.signal.aborted) {
        return;
      }
      console.error('Error fetching location suggestions:', error);
      setLocationSuggestions([]);
      setShowLocationSuggestions(false);
    } finally {
      if (!controller.signal.aborted) {
        setIsLoadingSuggestions(false);
      }
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
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
    
    // Debounce the API call and tracking
    debounceRef.current = setTimeout(() => {
      fetchLocationSuggestions(value);
      
      // Track location typing (only if user typed more than 2 chars)
      if (value.length >= 3) {
        track({
          eventType: 'input',
          eventCategory: 'search',
          eventAction: 'location_typed',
          locationQuery: value,
        });
      }
    }, 300);
  };

  // Handle suggestion selection
  const selectSuggestion = (suggestion: LocationSuggestion) => {
    // Track suggestion selection (non-blocking)
    track({
      eventType: 'click',
      eventCategory: 'search',
      eventAction: 'location_suggestion_selected',
      eventLabel: suggestion.location_type,
      locationQuery: suggestion.place_name,
    });
    
    setLocation(suggestion.place_name);
    setShowLocationSuggestions(false);
    setSelectedLocationIndex(-1);
    // Clear GPS coordinates when selecting a suggestion (this is not GPS location)
    setGpsCoordinates(null);
    locationInputRef.current?.focus();
  };

  // Handle search term suggestion selection
  const selectSearchSuggestion = (suggestion: { value: string; displayValue: string; type: string }, position: number) => {
    track({
      eventType: 'click',
      eventCategory: 'search',
      eventAction: 'suggestion_selected',
      eventLabel: suggestion.value,
      searchTerm: suggestion.value,
      metadata: {
        suggestionType: suggestion.type,
        suggestionValue: suggestion.value,
        position: position,
        originalQuery: searchTerm,
        totalSuggestions: searchSuggestions.length
      },
    });
    
    setSearchTerm(suggestion.displayValue);
    setShowSearchSuggestions(false);
    setSelectedSearchIndex(-1);
    searchInputRef.current?.focus();
  };
  
  // Handle search term keyboard navigation
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (!showSearchSuggestions || searchSuggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSearch();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSearchIndex(prev => 
          prev < searchSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSearchIndex(prev => 
          prev > 0 ? prev - 1 : searchSuggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSearchIndex >= 0) {
          const selectedSuggestion = searchSuggestions[selectedSearchIndex];
          selectSearchSuggestion(selectedSuggestion, selectedSearchIndex);
          // Pass the selected value directly to avoid race condition
          handleSearch({ searchTermOverride: selectedSuggestion.displayValue, usedSuggestion: true });
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowSearchSuggestions(false);
        setSelectedSearchIndex(-1);
        break;
    }
  };

  // Handle location keyboard navigation
  const handleLocationKeyDown = (e: React.KeyboardEvent) => {
    if (!showLocationSuggestions || locationSuggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSearch();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedLocationIndex(prev => 
          prev < locationSuggestions.length - 1 ? prev + 1 : 0
        );
        track({
          eventType: 'interaction',
          eventCategory: 'search',
          eventAction: 'keyboard_navigation',
          eventLabel: 'arrow_down'
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedLocationIndex(prev => 
          prev > 0 ? prev - 1 : locationSuggestions.length - 1
        );
        track({
          eventType: 'interaction',
          eventCategory: 'search',
          eventAction: 'keyboard_navigation',
          eventLabel: 'arrow_up'
        });
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedLocationIndex >= 0) {
          track({
            eventType: 'click',
            eventCategory: 'search',
            eventAction: 'location_suggestion_keyboard_selected',
            eventLabel: locationSuggestions[selectedLocationIndex].location_type,
            locationQuery: locationSuggestions[selectedLocationIndex].place_name,
          });
          selectSuggestion(locationSuggestions[selectedLocationIndex]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowLocationSuggestions(false);
        setSelectedLocationIndex(-1);
        break;
    }
  };


  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close location suggestions
      if (
        locationSuggestionsRef.current &&
        !locationSuggestionsRef.current.contains(event.target as Node) &&
        !locationInputRef.current?.contains(event.target as Node)
      ) {
        setShowLocationSuggestions(false);
        setSelectedLocationIndex(-1);
      }
      
      // Close search suggestions
      if (
        searchSuggestionsRef.current &&
        !searchSuggestionsRef.current.contains(event.target as Node) &&
        !searchInputRef.current?.contains(event.target as Node)
      ) {
        setShowSearchSuggestions(false);
        setSelectedSearchIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);
  
  // Show search suggestions when there are matches
  useEffect(() => {
    if (searchTerm.length >= 2 && searchSuggestions.length > 0) {
      setShowSearchSuggestions(true);
      
      // Track suggestions impression
      track({
        eventType: 'impression',
        eventCategory: 'search',
        eventAction: 'suggestions_shown',
        eventLabel: searchTerm,
        metadata: { suggestionCount: searchSuggestions.length }
      });
    } else {
      setShowSearchSuggestions(false);
    }
  }, [searchSuggestions.length, searchTerm]);

  // Track GPS coordinates when using locate me
  const [gpsCoordinates, setGpsCoordinates] = useState<{lat: number; lng: number} | null>(null);

  // Robust search handler that always uses explicit parameters to avoid race conditions
  const handleSearch = (options: { searchTermOverride?: string; locationOverride?: string; usedSuggestion?: boolean } = {}) => {
    // ALWAYS use overrides if provided, otherwise fall back to current state
    const effectiveSearchTerm = options.searchTermOverride ?? searchTerm;
    const effectiveLocation = options.locationOverride ?? location;
    const usedSuggestion = options.usedSuggestion ?? false;
    
    // Build the full query string for analytics
    const fullQuery = [effectiveSearchTerm, effectiveLocation].filter(Boolean).join(' in ');
    const queryType = effectiveSearchTerm && effectiveLocation ? 'full_query' : 
                      effectiveSearchTerm ? 'search_term_only' : 
                      effectiveLocation ? 'location_only' : 'empty_search';
    
    // Track search submission (non-blocking) with enhanced query tracking
    track({
      eventType: 'click',
      eventCategory: 'search',
      eventAction: usedSuggestion ? 'search_with_suggestion' : 'search_manual',
      searchTerm: effectiveSearchTerm || undefined,
      locationQuery: effectiveLocation || undefined,
      metadata: {
        fullQuery: fullQuery || 'empty_search',
        queryType: queryType,
        searchTermLength: effectiveSearchTerm.length,
        locationLength: effectiveLocation.length,
        hasSearchTerm: !!effectiveSearchTerm,
        hasLocation: !!effectiveLocation,
        useGPS: !!gpsCoordinates,
        variant: variant,
        hadSuggestions: searchSuggestions.length > 0,
        suggestionCount: searchSuggestions.length,
        usedSuggestion: usedSuggestion,
        timestamp: new Date().toISOString()
      },
    });
    
    // Track funnel step (non-blocking)
    trackFunnel({
      funnelStep: 'search_initiated',
      stepOrder: 2,
    });
    
    // Create URL search parameters
    const params = new URLSearchParams();
    if (effectiveSearchTerm) params.set('search', effectiveSearchTerm);
    if (effectiveLocation) params.set('location', effectiveLocation);
    
    // If we have GPS coordinates from locate me, include them
    if (gpsCoordinates) {
      params.set('lat', gpsCoordinates.lat.toString());
      params.set('lng', gpsCoordinates.lng.toString());
      params.set('useGPS', 'true');
    }
    
    // Navigate immediately without waiting for analytics
    navigate(`/results?${params.toString()}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      // Track Enter key submission (non-blocking)
      track({
        eventType: 'click',
        eventCategory: 'search',
        eventAction: 'search_submitted_keyboard',
        searchTerm: searchTerm || undefined,
        locationQuery: location || undefined,
        metadata: {
          inputMethod: 'keyboard',
        },
      });
      
      handleSearch();
    }
  };

  return (
    <div className={`w-full ${variant === 'hero' ? 'max-w-2xl' : 'max-w-5xl'} mx-auto`}>
      {variant === 'hero' ? (
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none z-10" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Search for bars, restaurants, or cuisines..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                
                // Track search term typing (debounced)
                if (searchDebounceRef.current) {
                  clearTimeout(searchDebounceRef.current);
                }
                
                searchDebounceRef.current = setTimeout(() => {
                  if (e.target.value.length >= 3) {
                    track({
                      eventType: 'input',
                      eventCategory: 'search',
                      eventAction: 'search_term_typed',
                      searchTerm: e.target.value,
                    });
                  }
                }, 1000);
              }}
              onFocus={() => {
                track({
                  eventType: 'focus',
                  eventCategory: 'search',
                  eventAction: 'search_input_focus',
                });
                if (searchTerm.length >= 2 && searchSuggestions.length > 0) {
                  setShowSearchSuggestions(true);
                }
              }}
              onKeyDown={handleSearchKeyDown}
              className="pl-12 pr-12 py-4 text-sm border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl bg-gray-50"
              autoComplete="off"
            />
            {searchTerm && (
              <button
                onClick={() => {
                  track({
                    eventType: 'click',
                    eventCategory: 'search',
                    eventAction: 'search_term_cleared',
                  });
                  setSearchTerm('');
                  setShowSearchSuggestions(false);
                }}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors z-20"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            
            {/* Search suggestions dropdown */}
            {showSearchSuggestions && searchSuggestions.length > 0 && (
              <div
                ref={searchSuggestionsRef}
                className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
              >
                {searchSuggestions.map((suggestion, index) => (
                  <div
                    key={`${suggestion.type}-${suggestion.value}`}
                    className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-gray-50 ${
                      index === selectedSearchIndex ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                    onClick={() => {
                      selectSearchSuggestion(suggestion, index);
                      // Pass the selected value directly to avoid race condition
                      handleSearch({ searchTermOverride: suggestion.displayValue, usedSuggestion: true });
                    }}
                  >
                    <span className="text-sm font-medium text-gray-900">
                      {suggestion.displayValue}
                    </span>
                  </div>
                ))}
              </div>
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
              onFocus={() => {
                track({
                  eventType: 'focus',
                  eventCategory: 'search',
                  eventAction: 'location_input_focus',
                });
              }}
              onKeyDown={handleLocationKeyDown}
              className="pl-12 pr-12 py-4 text-sm border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl bg-gray-50"
              autoComplete="off"
            />
            {/* Locate me button */}
            <button
              type="button"
              aria-label="Use my location"
              onClick={() => {
                // Track locate me click (non-blocking)
                track({
                  eventType: 'click',
                  eventCategory: 'search',
                  eventAction: 'locate_me_clicked',
                });
                
                locate().then((r) => {
                  if (r?.display) {
                    // Track GPS success (non-blocking)
                    track({
                      eventType: 'interaction',
                      eventCategory: 'search',
                      eventAction: 'gps_success',
                      locationQuery: r.display,
                    });
                    
                    setLocation(r.display);
                    setShowLocationSuggestions(false);
                    // Store GPS coordinates for search
                    if (r.latitude && r.longitude) {
                      setGpsCoordinates({ lat: r.latitude, lng: r.longitude });
                    }
                  } else {
                    // Track GPS failure (non-blocking)
                    track({
                      eventType: 'error',
                      eventCategory: 'search',
                      eventAction: 'gps_failed',
                    });
                  }
                });
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
                  track({
                    eventType: 'click',
                    eventCategory: 'search',
                    eventAction: 'location_cleared',
                  });
                  setLocation('');
                  setShowLocationSuggestions(false);
                  setLocationSuggestions([]);
                  setGpsCoordinates(null);
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
            {showLocationSuggestions && locationSuggestions.length > 0 && (
              <div
                ref={locationSuggestionsRef}
                className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
              >
                {locationSuggestions.map((suggestion, index) => (
                  <div
                    key={suggestion.id}
                    className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-gray-50 ${
                      index === selectedLocationIndex ? 'bg-blue-50 border-blue-200' : ''
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
            onClick={() => handleSearch()}
            className="w-full py-4 text-lg font-semibold rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Search
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg p-2 flex flex-col lg:flex-row gap-2 items-stretch">
          {/* Search input */}
          <div className="flex-1 relative flex items-center">
            <Search className="absolute left-4 text-gray-400 w-5 h-5 pointer-events-none z-10" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Search for bars, restaurants, or cuisines..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                
                // Track search term typing (debounced)
                if (searchDebounceRef.current) {
                  clearTimeout(searchDebounceRef.current);
                }
                
                searchDebounceRef.current = setTimeout(() => {
                  if (e.target.value.length >= 3) {
                    track({
                      eventType: 'input',
                      eventCategory: 'search',
                      eventAction: 'search_term_typed',
                      searchTerm: e.target.value,
                    });
                  }
                }, 1000);
              }}
              onFocus={() => {
                track({
                  eventType: 'focus',
                  eventCategory: 'search',
                  eventAction: 'search_input_focus',
                });
                if (searchTerm.length >= 2 && searchSuggestions.length > 0) {
                  setShowSearchSuggestions(true);
                }
              }}
              onKeyDown={handleSearchKeyDown}
              className="pl-12 pr-12 h-14 text-base border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl leading-none"
              autoComplete="off"
            />
            {searchTerm && (
              <button
                onClick={() => {
                  track({
                    eventType: 'click',
                    eventCategory: 'search',
                    eventAction: 'search_term_cleared',
                  });
                  setSearchTerm('');
                  setShowSearchSuggestions(false);
                }}
                className="absolute right-4 text-gray-400 hover:text-gray-600 transition-colors z-20"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            
            {/* Search suggestions dropdown */}
            {showSearchSuggestions && searchSuggestions.length > 0 && (
              <div
                ref={searchSuggestionsRef}
                className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
              >
                {searchSuggestions.map((suggestion, index) => (
                  <div
                    key={`${suggestion.type}-${suggestion.value}`}
                    className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-gray-50 ${
                      index === selectedSearchIndex ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                    onClick={() => {
                      selectSearchSuggestion(suggestion, index);
                      handleSearch({ searchTermOverride: suggestion.displayValue, usedSuggestion: true });
                    }}
                  >
                    <span className="text-sm font-medium text-gray-900">
                      {suggestion.displayValue}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Divider */}
          <div className="hidden lg:block w-px bg-gray-200 my-2"></div>
          
          {/* Location input with autocomplete */}
          <div className="flex-1 lg:flex-1 relative flex items-center">
            <MapPin className="absolute left-4 text-gray-400 w-5 h-5 pointer-events-none z-10" />
            <Input
              ref={locationInputRef}
              type="text"
              placeholder="City, State or ZIP"
              value={location}
              onChange={(e) => handleLocationChange(e.target.value)}
              onFocus={() => {
                track({
                  eventType: 'focus',
                  eventCategory: 'search',
                  eventAction: 'location_input_focus',
                });
              }}
              onKeyDown={handleLocationKeyDown}
              className="pl-12 pr-24 h-14 text-base border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl leading-none"
              autoComplete="off"
            />
            {/* Locate me button */}
            <button
              type="button"
              aria-label="Use my location"
              onClick={() => {
                // Track locate me click (non-blocking)
                track({
                  eventType: 'click',
                  eventCategory: 'search',
                  eventAction: 'locate_me_clicked',
                });
                
                locate().then((r) => {
                  if (r?.display) {
                    // Track GPS success (non-blocking)
                    track({
                      eventType: 'interaction',
                      eventCategory: 'search',
                      eventAction: 'gps_success',
                      locationQuery: r.display,
                    });
                    
                    setLocation(r.display);
                    setShowLocationSuggestions(false);
                    // Store GPS coordinates for search
                    if (r.latitude && r.longitude) {
                      setGpsCoordinates({ lat: r.latitude, lng: r.longitude });
                    }
                  } else {
                    // Track GPS failure (non-blocking)
                    track({
                      eventType: 'error',
                      eventCategory: 'search',
                      eventAction: 'gps_failed',
                    });
                  }
                });
              }}
              className="absolute right-12 text-gray-500 hover:text-gray-700 transition-colors z-20 w-11 h-14 flex items-center justify-center"
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
                  track({
                    eventType: 'click',
                    eventCategory: 'search',
                    eventAction: 'location_cleared',
                  });
                  setLocation('');
                  setShowLocationSuggestions(false);
                  setLocationSuggestions([]);
                  setGpsCoordinates(null);
                }}
                className="absolute right-4 text-gray-400 hover:text-gray-600 transition-colors z-20 flex items-center h-14"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            
            {/* Loading indicator */}
            {isLoadingSuggestions && (
              <div className="absolute right-4 flex items-center h-14">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-gray-600"></div>
              </div>
            )}
            
            {/* Suggestions dropdown */}
            {showLocationSuggestions && locationSuggestions.length > 0 && (
              <div
                ref={locationSuggestionsRef}
                className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
              >
                {locationSuggestions.map((suggestion, index) => (
                  <div
                    key={suggestion.id}
                    className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-gray-50 ${
                      index === selectedLocationIndex ? 'bg-blue-50 border-blue-200' : ''
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
            onClick={() => handleSearch()}
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-8 h-14 text-base font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center"
          >
            Search
          </Button>
        </div>
      )}
    </div>
  );
};
