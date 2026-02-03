import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin, ChevronDown, ChevronUp, X, LocateFixed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useLocateMe } from '@/hooks/useLocateMe';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useLocationSuggestions } from '@/hooks/useLocationSuggestions';

interface MobileSearchBarProps {
  onExpandedChange?: (isExpanded: boolean) => void;
}

export const MobileSearchBar = ({ onExpandedChange }: MobileSearchBarProps = {}) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { track } = useAnalytics();
  
  // Core search state
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [location, setLocation] = useState(searchParams.get('location') || searchParams.get('zip') || '');
  
  // UI state
  const [isExpanded, setIsExpanded] = useState(false);
  const [gpsCoordinates, setGpsCoordinates] = useState<{lat: number; lng: number} | null>(null);
  
  // Hooks
  const { locate, isLocating } = useLocateMe();
  const locationInputRef = useRef<HTMLInputElement>(null);
  
  // Location suggestions via shared hook
  const {
    suggestions: locationSuggestions,
    isLoading: isLoadingSuggestions,
    showSuggestions,
    selectedIndex: selectedSuggestionIndex,
    fetchSuggestions,
    selectSuggestion: selectLocationSuggestion,
    handleKeyDown: handleLocationKeyDownBase,
    clearSuggestions,
    hideSuggestions,
    suggestionsRef,
    cleanup,
  } = useLocationSuggestions({
    debounceMs: 400, // Slightly higher for mobile
    onSelect: (suggestion) => {
      console.log('[MobileSearch] Location suggestion selected:', {
        suggestion,
        previousLocation: location,
        totalSuggestions: locationSuggestions.length
      });
      setLocation(suggestion.place_name);
      setGpsCoordinates(null); // Clear GPS when selecting a suggestion
      locationInputRef.current?.focus();
    }
  });

  // Handle location input change
  const handleLocationChange = (value: string) => {
    setLocation(value);
    setGpsCoordinates(null); // Clear GPS coordinates when manually editing
    fetchSuggestions(value);
  };

  // Wrap keyboard handler to include search trigger
  const handleLocationKeyDown = (e: React.KeyboardEvent) => {
    handleLocationKeyDownBase(e, () => {
      console.log('[MobileSearch] Enter pressed (no suggestions visible):', { searchTerm, location });
      handleSearch();
    });
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !locationInputRef.current?.contains(event.target as Node)
      ) {
        hideSuggestions();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      cleanup();
    };
  }, [hideSuggestions, cleanup]);

  const handleSearch = () => {
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

  const handleLocateMe = async () => {
    track({
      eventType: 'click',
      eventCategory: 'search',
      eventAction: 'locate_me_clicked',
      eventLabel: 'mobile_search_drawer'
    });
    
    const r = await locate();
    if (r?.display) {
      setLocation(r.display);
      hideSuggestions();
      if (r.latitude && r.longitude) {
        setGpsCoordinates({ lat: r.latitude, lng: r.longitude });
      }
      
      track({
        eventType: 'interaction',
        eventCategory: 'search',
        eventAction: 'gps_location_obtained',
        metadata: { source: 'locate_me_button' }
      });
    }
  };

  const handleClearLocation = () => {
    setLocation('');
    clearSuggestions();
    setGpsCoordinates(null);
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
                        onClick={handleLocateMe}
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
                          onClick={handleClearLocation}
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
                              onClick={() => selectLocationSuggestion(suggestion)}
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

              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </div>
  );
};
