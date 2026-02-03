import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin, ChevronDown, ChevronUp, X, LocateFixed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TimeDropdown } from './TimeDropdown';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { useLocateMe } from '@/hooks/useLocateMe';
import { useAnalytics } from '@/hooks/useAnalytics';
import { locationCache } from '@/utils/locationCache';

interface LocationSuggestion {
  id: string;
  place_name: string;
  center: [number, number];
  place_type: string[];
  text: string;
  location_type: string;
}

interface MobileSearchBarProps {
  onExpandedChange?: (isExpanded: boolean) => void;
}

export const MobileSearchBar = ({ onExpandedChange }: MobileSearchBarProps = {}) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { track } = useAnalytics();
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Get current values from URL
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [location, setLocation] = useState(searchParams.get('location') || searchParams.get('zip') || '');
  const [startTime, setStartTime] = useState(searchParams.get('startTime') || '');
  const [endTime, setEndTime] = useState(searchParams.get('endTime') || '');
  const [gpsCoordinates, setGpsCoordinates] = useState<{lat: number; lng: number} | null>(null);
  
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
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch location suggestions
  const fetchLocationSuggestions = async (query: string) => {
    if (query.length < 2) {
      setLocationSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Check cache first
    const cachedSuggestions = locationCache.get(query);
    if (cachedSuggestions) {
      setLocationSuggestions(cachedSuggestions);
      setShowSuggestions(true);
      setSelectedSuggestionIndex(-1);
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
      setShowSuggestions(true);
      setSelectedSuggestionIndex(-1);
      
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
      setShowSuggestions(false);
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
    
    // Debounce the API call
    debounceRef.current = setTimeout(() => {
      fetchLocationSuggestions(value);
    }, 300);
  };

  // Handle suggestion selection
  const selectSuggestion = (suggestion: LocationSuggestion) => {
    console.log('[MobileSearch] Location suggestion selected:', {
      suggestion,
      previousLocation: location,
      totalSuggestions: locationSuggestions.length
    });
    
    setLocation(suggestion.place_name);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    // Clear GPS coordinates when selecting a suggestion (this is not GPS location)
    setGpsCoordinates(null);
    locationInputRef.current?.focus();
    
    // Track suggestion selection
    track({
      eventType: 'click',
      eventCategory: 'search',
      eventAction: 'location_suggestion_selected',
      eventLabel: suggestion.place_name,
      metadata: { locationType: suggestion.location_type }
    });
  };

  // Handle keyboard navigation
  const handleLocationKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || locationSuggestions.length === 0) {
      if (e.key === 'Enter') {
        console.log('[MobileSearch] Enter pressed (no suggestions visible):', { searchTerm, location });
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
        // Track keyboard navigation
        track({
          eventType: 'interaction',
          eventCategory: 'search',
          eventAction: 'keyboard_navigation',
          eventLabel: 'arrow_down'
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : locationSuggestions.length - 1
        );
        // Track keyboard navigation
        track({
          eventType: 'interaction',
          eventCategory: 'search',
          eventAction: 'keyboard_navigation',
          eventLabel: 'arrow_up'
        });
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          const selectedSuggestion = locationSuggestions[selectedSuggestionIndex];
          console.log('[MobileSearch] Enter pressed with suggestion selected:', {
            selectedSuggestionIndex,
            selectedSuggestion
          });
          selectSuggestion(selectedSuggestion);
        } else {
          console.log('[MobileSearch] Enter pressed (no suggestion highlighted):', { searchTerm, location });
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
    // Debug logging for search flow
    console.log('[MobileSearch] handleSearch called:', {
      searchTerm,
      location,
      hasGpsCoordinates: !!gpsCoordinates,
      gpsCoordinates,
      isExpanded
    });
    
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (location) params.set('location', location);
    
    // If we have GPS coordinates from locate me, include them
    if (gpsCoordinates) {
      params.set('lat', gpsCoordinates.lat.toString());
      params.set('lng', gpsCoordinates.lng.toString());
      params.set('useGPS', 'true');
    }
    
    // Build the full query string for analytics
    const fullQuery = [searchTerm, location].filter(Boolean).join(' in ');
    const queryType = searchTerm && location ? 'full_query' : 
                      searchTerm ? 'search_term_only' : 
                      location ? 'location_only' : 'empty_search';
    
    // Track search submission with enhanced query tracking
    track({
      eventType: 'form_submit',
      eventCategory: 'search',
      eventAction: 'mobile_search_submitted',
      searchTerm: searchTerm || undefined,
      locationQuery: location || undefined,
      metadata: {
        fullQuery: fullQuery || 'empty_search',
        queryType: queryType,
        searchTermLength: searchTerm.length,
        locationLength: location.length,
        hasSearchTerm: !!searchTerm,
        hasLocation: !!location,
        hasGPS: !!gpsCoordinates,
        isExpanded: isExpanded,
        timestamp: new Date().toISOString()
      }
    });
    
    const targetUrl = `/results?${params.toString()}`;
    
    // Debug logging before navigation
    console.log('[MobileSearch] Navigating to:', {
      targetUrl,
      params: Object.fromEntries(params.entries()),
      paramsString: params.toString()
    });
    
    navigate(targetUrl);
    setIsExpanded(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      console.log('[MobileSearch] Enter key pressed in search input:', { searchTerm });
      handleSearch();
    }
  };

  const hasFilters = location;

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Always visible search input */}
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative flex items-center">
            <Search className="absolute left-3 text-gray-400 w-4 h-4 pointer-events-none" />
            <Input
              type="text"
              placeholder="Search bars, restaurants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-10 pr-10 h-12 text-xs border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-gray-50 rounded-lg leading-none"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 text-gray-400 hover:text-gray-600 transition-colors w-11 h-12 flex items-center justify-center"
                type="button"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {/* Search button - visible in collapsed state */}
          <Button 
            onClick={handleSearch}
            size="icon"
            className="h-12 w-12 min-w-[44px] rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-sm"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </Button>
          
          <Collapsible open={isExpanded} onOpenChange={(open) => {
            setIsExpanded(open);
            onExpandedChange?.(open);
            // Track drawer state changes
            track({
              eventType: 'interaction',
              eventCategory: 'search',
              eventAction: open ? 'mobile_search_drawer_opened' : 'mobile_search_drawer_closed'
            });
          }}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className={`px-3 py-3 h-12 rounded-lg ${hasFilters ? 'bg-orange-50 text-orange-600 border border-orange-200' : 'bg-gray-50 text-gray-500 border border-gray-200'}`}
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <div className="fixed inset-0 bg-white z-50 flex flex-col">
                {/* Header with search bar */}
                <div className="flex-shrink-0 p-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 relative flex items-center">
                      <Search className="absolute left-3 text-gray-400 w-4 h-4 pointer-events-none" />
                      <Input
                        type="text"
                        placeholder="Search bars, restaurants..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="pl-10 pr-10 h-12 text-xs border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-gray-50 rounded-lg leading-none"
                      />
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm('')}
                          className="absolute right-3 text-gray-400 hover:text-gray-600 transition-colors w-11 h-12 flex items-center justify-center"
                          type="button"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
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
                  
                  {/* Location */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900">Where are you looking?</h3>
                    <div className="relative flex items-center">
                      <MapPin className="absolute left-3 text-gray-400 w-4 h-4 pointer-events-none z-10" />
                      <Input
                        ref={locationInputRef}
                        type="text"
                        placeholder="City, State or ZIP"
                        value={location}
                        onChange={(e) => handleLocationChange(e.target.value)}
                        onKeyDown={handleLocationKeyDown}
                        className="pl-10 pr-20 h-12 text-base bg-gray-50 border-gray-200 rounded-lg leading-none"
                        autoComplete="off"
                      />
                      {/* Locate me button */}
                      <button
                        type="button"
                        aria-label="Use my location"
                        onClick={async () => {
                          // Track locate me click
                          track({
                            eventType: 'click',
                            eventCategory: 'search',
                            eventAction: 'locate_me_clicked',
                            eventLabel: 'mobile_search_drawer'
                          });
                          
                          const r = await locate();
                          if (r?.display) {
                            setLocation(r.display);
                            setShowSuggestions(false);
                            // Store GPS coordinates for search
                            if (r.latitude && r.longitude) {
                              setGpsCoordinates({ lat: r.latitude, lng: r.longitude });
                            }
                            
                            // Track successful GPS location
                            track({
                              eventType: 'interaction',
                              eventCategory: 'search',
                              eventAction: 'gps_location_obtained',
                              metadata: { source: 'locate_me_button' }
                            });
                          }
                        }}
                        className="absolute right-10 text-gray-500 hover:text-gray-700 transition-colors z-20 w-11 h-12 flex items-center justify-center"
                      >
                        {isLocating ? (
                          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                        ) : (
                          <LocateFixed className="w-4 h-4" />
                        )}
                      </button>
                      
                      {/* Clear button */}
                      {location && (
                        <button
                          onClick={() => {
                            setLocation('');
                            setShowSuggestions(false);
                            setLocationSuggestions([]);
                            setGpsCoordinates(null);
                          }}
                          className="absolute right-3 text-gray-400 hover:text-gray-600 transition-colors z-20 w-11 h-12 flex items-center justify-center"
                          type="button"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      
                      {/* Loading indicator */}
                      {isLoadingSuggestions && (
                        <div className="absolute right-3 flex items-center h-12">
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
                  </div>
                  
                  {/* Search button in expanded state */}
                  <Button
                    onClick={handleSearch}
                    className="w-full h-12 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold text-base rounded-lg shadow-md"
                  >
                    <Search className="w-5 h-5 mr-2" />
                    Search
                  </Button>
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