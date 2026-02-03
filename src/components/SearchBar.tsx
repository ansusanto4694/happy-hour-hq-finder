import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin, X, LocateFixed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLocateMe } from '@/hooks/useLocateMe';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useSearchSuggestions } from '@/hooks/useSearchSuggestions';
import { useLocationSuggestions, type LocationSuggestion } from '@/hooks/useLocationSuggestions';

interface SearchBarProps {
  variant?: 'hero' | 'results';
}

export const SearchBar = ({ variant = 'hero' }: SearchBarProps) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { track, trackFunnel } = useAnalytics();
  
  // Core state
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [location, setLocation] = useState(searchParams.get('location') || searchParams.get('zip') || '');
  const [gpsCoordinates, setGpsCoordinates] = useState<{lat: number; lng: number} | null>(null);
  
  // Search term autocomplete state
  const { suggestions: searchSuggestions } = useSearchSuggestions({ query: searchTerm, maxResults: 7 });
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(-1);
  const justSelectedSuggestionRef = useRef(false);
  
  // Hooks
  const { locate, isLocating } = useLocateMe();
  
  // Refs
  const locationInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchSuggestionsRef = useRef<HTMLDivElement>(null);
  const searchDebounceRef = useRef<NodeJS.Timeout>();

  // Location suggestions via shared hook
  const {
    suggestions: locationSuggestions,
    isLoading: isLoadingSuggestions,
    showSuggestions: showLocationSuggestions,
    selectedIndex: selectedLocationIndex,
    fetchSuggestions,
    selectSuggestion: selectLocationSuggestion,
    handleKeyDown: handleLocationKeyDownBase,
    clearSuggestions,
    hideSuggestions: hideLocationSuggestions,
    suggestionsRef: locationSuggestionsRef,
    cleanup,
  } = useLocationSuggestions({
    debounceMs: 300, // Desktop can handle faster
    onSelect: (suggestion) => {
      setLocation(suggestion.place_name);
      setGpsCoordinates(null);
      locationInputRef.current?.focus();
    }
  });

  // Handle location input change
  const handleLocationChange = (value: string) => {
    setLocation(value);
    setGpsCoordinates(null);
    fetchSuggestions(value);
    
    // Track location typing (debounced in hook)
    if (value.length >= 3) {
      track({
        eventType: 'input',
        eventCategory: 'search',
        eventAction: 'location_typed',
        locationQuery: value,
      });
    }
  };

  // Handle search term suggestion selection
  const selectSearchSuggestion = (suggestion: { value: string; displayValue: string; type: string }, position: number) => {
    console.log('[Search] Suggestion selected:', {
      suggestion,
      position,
      previousSearchTerm: searchTerm,
      totalSuggestions: searchSuggestions.length
    });
    
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
    
    justSelectedSuggestionRef.current = true;
    setSearchTerm(suggestion.displayValue);
    setShowSearchSuggestions(false);
    setSelectedSearchIndex(-1);
  };
  
  // Handle search term keyboard navigation
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (!showSearchSuggestions || searchSuggestions.length === 0) {
      if (e.key === 'Enter') {
        console.log('[Search] Enter pressed (no suggestions visible):', { searchTerm });
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
          console.log('[Search] Enter pressed with suggestion selected:', {
            selectedSearchIndex,
            selectedSuggestion,
            willPassOverride: selectedSuggestion.displayValue
          });
          selectSearchSuggestion(selectedSuggestion, selectedSearchIndex);
          handleSearch({ searchTermOverride: selectedSuggestion.displayValue, usedSuggestion: true });
        } else {
          console.log('[Search] Enter pressed (no suggestion highlighted):', { searchTerm });
          handleSearch();
        }
        break;
      case 'Escape':
        setShowSearchSuggestions(false);
        setSelectedSearchIndex(-1);
        break;
    }
  };

  // Wrap location keyboard handler
  const handleLocationKeyDown = (e: React.KeyboardEvent) => {
    handleLocationKeyDownBase(e, () => handleSearch());
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
        hideLocationSuggestions();
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
      cleanup();
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [hideLocationSuggestions, cleanup]);
  
  // Show search suggestions when there are matches
  useEffect(() => {
    if (justSelectedSuggestionRef.current) {
      justSelectedSuggestionRef.current = false;
      return;
    }
    
    if (searchTerm.length >= 2 && searchSuggestions.length > 0) {
      setShowSearchSuggestions(true);
      
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

  // Robust search handler
  const handleSearch = async (options: { searchTermOverride?: string; locationOverride?: string; usedSuggestion?: boolean } = {}) => {
    const effectiveSearchTerm = options.searchTermOverride ?? searchTerm;
    let effectiveLocation = options.locationOverride ?? location;
    const usedSuggestion = options.usedSuggestion ?? false;
    
    // Auto-trigger GPS if no location
    let autoGpsCoordinates = gpsCoordinates;
    if (!effectiveLocation && !gpsCoordinates) {
      console.log('[Search] No location provided, auto-triggering GPS...');
      track({
        eventType: 'interaction',
        eventCategory: 'search',
        eventAction: 'auto_gps_triggered',
        searchTerm: effectiveSearchTerm,
      });
      
      const gpsResult = await locate();
      if (gpsResult?.display) {
        effectiveLocation = gpsResult.display;
        setLocation(gpsResult.display);
        if (gpsResult.latitude && gpsResult.longitude) {
          autoGpsCoordinates = { lat: gpsResult.latitude, lng: gpsResult.longitude };
          setGpsCoordinates(autoGpsCoordinates);
        }
        track({
          eventType: 'interaction',
          eventCategory: 'search',
          eventAction: 'auto_gps_success',
          locationQuery: gpsResult.display,
        });
      } else {
        track({
          eventType: 'error',
          eventCategory: 'search',
          eventAction: 'auto_gps_failed',
        });
      }
    }
    
    console.log('[Search] handleSearch called:', {
      options,
      effectiveSearchTerm,
      effectiveLocation,
      usedSuggestion,
      stateSearchTerm: searchTerm,
      stateLocation: location,
      hasGpsCoordinates: !!autoGpsCoordinates,
      variant
    });
    
    const fullQuery = [effectiveSearchTerm, effectiveLocation].filter(Boolean).join(' in ');
    const queryType = effectiveSearchTerm && effectiveLocation ? 'full_query' : 
                      effectiveSearchTerm ? 'search_term_only' : 
                      effectiveLocation ? 'location_only' : 'empty_search';
    
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
        useGPS: !!autoGpsCoordinates,
        variant: variant,
        hadSuggestions: searchSuggestions.length > 0,
        suggestionCount: searchSuggestions.length,
        usedSuggestion: usedSuggestion,
        timestamp: new Date().toISOString()
      },
    });
    
    trackFunnel({
      funnelStep: 'search_initiated',
      stepOrder: 2,
    });
    
    const params = new URLSearchParams();
    if (effectiveSearchTerm) params.set('search', effectiveSearchTerm);
    if (effectiveLocation) params.set('location', effectiveLocation);
    
    if (autoGpsCoordinates) {
      params.set('lat', autoGpsCoordinates.lat.toString());
      params.set('lng', autoGpsCoordinates.lng.toString());
      params.set('useGPS', 'true');
    }
    
    const targetUrl = `/results?${params.toString()}`;
    
    console.log('[Search] Navigating to:', {
      targetUrl,
      params: Object.fromEntries(params.entries()),
      paramsString: params.toString()
    });
    
    navigate(targetUrl);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
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

  const handleLocateMe = () => {
    track({
      eventType: 'click',
      eventCategory: 'search',
      eventAction: 'locate_me_clicked',
    });
    
    locate().then((r) => {
      if (r?.display) {
        track({
          eventType: 'interaction',
          eventCategory: 'search',
          eventAction: 'gps_success',
          locationQuery: r.display,
        });
        
        setLocation(r.display);
        hideLocationSuggestions();
        if (r.latitude && r.longitude) {
          setGpsCoordinates({ lat: r.latitude, lng: r.longitude });
        }
      } else {
        track({
          eventType: 'error',
          eventCategory: 'search',
          eventAction: 'gps_failed',
        });
      }
    });
  };

  const handleClearLocation = () => {
    track({
      eventType: 'click',
      eventCategory: 'search',
      eventAction: 'location_cleared',
    });
    setLocation('');
    clearSuggestions();
    setGpsCoordinates(null);
  };

  const handleClearSearchTerm = () => {
    track({
      eventType: 'click',
      eventCategory: 'search',
      eventAction: 'search_term_cleared',
    });
    setSearchTerm('');
    setShowSearchSuggestions(false);
  };

  // Shared search input component
  const renderSearchInput = (isHero: boolean) => (
    <div className={`relative ${isHero ? '' : 'flex-1 flex items-center'}`}>
      <Search className={`absolute ${isHero ? 'left-4 top-1/2 transform -translate-y-1/2' : 'left-4'} text-gray-400 w-5 h-5 pointer-events-none z-10`} />
      <Input
        ref={searchInputRef}
        type="text"
        placeholder="Search for bars, restaurants, or cuisines..."
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          
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
        className={`pl-12 pr-12 ${isHero ? 'py-4 text-sm border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl bg-gray-50' : 'h-14 text-base border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl leading-none'}`}
        autoComplete="off"
      />
      {searchTerm && (
        <button
          onClick={handleClearSearchTerm}
          className={`absolute ${isHero ? 'right-4 top-1/2 transform -translate-y-1/2' : 'right-4'} text-gray-400 hover:text-gray-600 transition-colors z-20`}
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
                console.log('[Search] Suggestion clicked:', { suggestion, index, fillOnly: true });
                selectSearchSuggestion(suggestion, index);
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
  );

  // Shared location input component
  const renderLocationInput = (isHero: boolean) => (
    <div className={`relative ${isHero ? '' : 'flex-1 lg:flex-1 flex items-center'}`}>
      <MapPin className={`absolute ${isHero ? 'left-4 top-1/2 transform -translate-y-1/2' : 'left-4'} text-gray-400 w-5 h-5 ${isHero ? 'z-10' : 'pointer-events-none z-10'}`} />
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
        className={`pl-12 ${isHero ? 'pr-12 py-4 text-sm border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl bg-gray-50' : 'pr-24 h-14 text-base border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl leading-none'}`}
        autoComplete="off"
      />
      
      {/* Hero variant: Toggle between locate me and clear */}
      {isHero ? (
        location ? (
          <button
            onClick={handleClearLocation}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors z-20"
            type="button"
            aria-label="Clear location"
          >
            <X className="w-5 h-5" />
          </button>
        ) : (
          <button
            type="button"
            aria-label="Use my location"
            onClick={handleLocateMe}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors z-20"
          >
            {isLocating ? (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
            ) : (
              <LocateFixed className="w-5 h-5" />
            )}
          </button>
        )
      ) : (
        <>
          {/* Results variant: Both buttons visible */}
          <button
            type="button"
            aria-label="Use my location"
            onClick={handleLocateMe}
            className="absolute right-12 text-gray-500 hover:text-gray-700 transition-colors z-20 w-11 h-14 flex items-center justify-center"
          >
            {isLocating ? (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
            ) : (
              <LocateFixed className="w-5 h-5" />
            )}
          </button>
          
          {location && (
            <button
              onClick={handleClearLocation}
              className="absolute right-4 text-gray-400 hover:text-gray-600 transition-colors z-20 flex items-center h-14"
              type="button"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </>
      )}
      
      {/* Loading indicator */}
      {isLoadingSuggestions && (
        <div className={`absolute ${isHero ? 'right-4 top-1/2 transform -translate-y-1/2' : 'right-4 flex items-center h-14'}`}>
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
  );

  return (
    <div className={`w-full ${variant === 'hero' ? 'max-w-2xl' : 'max-w-5xl'} mx-auto`}>
      {variant === 'hero' ? (
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
          {renderSearchInput(true)}
          {renderLocationInput(true)}
          
          <Button
            onClick={() => handleSearch()}
            className="w-full py-4 text-lg font-semibold rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Search
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg p-2 flex flex-col lg:flex-row gap-2 items-stretch">
          {renderSearchInput(false)}
          
          {/* Divider */}
          <div className="hidden lg:block w-px bg-gray-200 my-2"></div>
          
          {renderLocationInput(false)}
          
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
