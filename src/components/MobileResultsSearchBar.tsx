import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin, X, LocateFixed, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLocateMe } from '@/hooks/useLocateMe';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useLocationSuggestions } from '@/hooks/useLocationSuggestions';
import { useSearchSuggestions } from '@/hooks/useSearchSuggestions';
import { inferLocationTypeFromInput } from '@/components/RadiusFilter';

interface MobileResultsSearchBarProps {
  onExpandedChange?: (isExpanded: boolean) => void;
}

export const MobileResultsSearchBar = ({ onExpandedChange }: MobileResultsSearchBarProps) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { track } = useAnalytics();

  // Core search state
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [location, setLocation] = useState(searchParams.get('location') || searchParams.get('zip') || '');
  const [gpsCoordinates, setGpsCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [locationType, setLocationType] = useState<string | null>(searchParams.get('locationType') || null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Search term autocomplete
  const { suggestions: searchSuggestions } = useSearchSuggestions({ query: searchTerm, maxResults: 5 });
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(-1);
  const justSelectedRef = useRef(false);

  const { locate, isLocating } = useLocateMe();
  const locationInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchSuggestionsRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Location suggestions
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
    debounceMs: 400,
    onSelect: (suggestion) => {
      setLocation(suggestion.place_name);
      setLocationType(suggestion.location_type);
      setGpsCoordinates(null);
      locationInputRef.current?.focus();
    },
  });

  // Build summary text for collapsed state
  const summaryText = (() => {
    const parts: string[] = [];
    if (searchTerm) parts.push(searchTerm);
    if (location) parts.push(location);
    if (parts.length === 0) return 'Search happy hours...';
    if (parts.length === 1) return parts[0];
    return `${parts[0]} in ${parts[1]}`;
  })();

  // Toggle expanded state
  const toggleExpanded = () => {
    const next = !isExpanded;
    setIsExpanded(next);
    onExpandedChange?.(next);
    track({
      eventType: 'interaction',
      eventCategory: 'search',
      eventAction: next ? 'mobile_search_panel_opened' : 'mobile_search_panel_closed',
    });
  };

  // Close panel
  const closePanel = () => {
    setIsExpanded(false);
    onExpandedChange?.(false);
    hideSuggestions();
    setShowSearchSuggestions(false);
    setSelectedSearchIndex(-1);
  };

  // Search suggestion selection (fill only, don't trigger search)
  const selectSearchSuggestion = (suggestion: { value: string; displayValue: string; type: string }, position: number) => {
    track({
      eventType: 'click',
      eventCategory: 'search',
      eventAction: 'suggestion_selected',
      eventLabel: suggestion.value,
      searchTerm: suggestion.value,
      metadata: {
        suggestionType: suggestion.type,
        position,
        originalQuery: searchTerm,
        totalSuggestions: searchSuggestions.length,
        source: 'mobile_results',
      },
    });
    justSelectedRef.current = true;
    setSearchTerm(suggestion.displayValue);
    setShowSearchSuggestions(false);
    setSelectedSearchIndex(-1);
  };

  // Show search suggestions when matches exist
  useEffect(() => {
    if (justSelectedRef.current) {
      justSelectedRef.current = false;
      return;
    }
    if (searchTerm.length >= 2 && searchSuggestions.length > 0) {
      setShowSearchSuggestions(true);
    } else {
      setShowSearchSuggestions(false);
    }
  }, [searchSuggestions.length, searchTerm]);

  // Handle location input change
  const handleLocationChange = (value: string) => {
    setLocation(value);
    setLocationType(null); // Clear until a new suggestion is selected
    setGpsCoordinates(null);
    fetchSuggestions(value);
  };

  // Wrap keyboard handler
  const handleLocationKeyDown = (e: React.KeyboardEvent) => {
    handleLocationKeyDownBase(e, () => {
      handleSearch();
    });
  };

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close location suggestions
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !locationInputRef.current?.contains(event.target as Node)
      ) {
        hideSuggestions();
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
    };
  }, [hideSuggestions, cleanup]);

  // Close panel on outside click (but not on the collapsed bar itself)
  useEffect(() => {
    if (!isExpanded) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        closePanel();
      }
    };

    // Delay to avoid closing immediately from the toggle click
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleOutsideClick);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isExpanded]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (location) params.set('location', location);

    if (gpsCoordinates) {
      params.set('lat', gpsCoordinates.lat.toString());
      params.set('lng', gpsCoordinates.lng.toString());
      params.set('useGPS', 'true');
    }

    // Propagate location type for smart default radius
    const effectiveLocationType = locationType || inferLocationTypeFromInput(location);
    if (effectiveLocationType) {
      params.set('locationType', effectiveLocationType);
    }

    const fullQuery = [searchTerm, location].filter(Boolean).join(' in ');
    const queryType = searchTerm && location
      ? 'full_query'
      : searchTerm
        ? 'search_term_only'
        : location
          ? 'location_only'
          : 'empty_search';

    track({
      eventType: 'form_submit',
      eventCategory: 'search',
      eventAction: 'mobile_search_submitted',
      searchTerm: searchTerm || undefined,
      locationQuery: location || undefined,
      metadata: {
        fullQuery: fullQuery || 'empty_search',
        queryType,
        hasSearchTerm: !!searchTerm,
        hasLocation: !!location,
        hasGPS: !!gpsCoordinates,
        timestamp: new Date().toISOString(),
      },
    });

    navigate(`/results?${params.toString()}`);
    closePanel();
  };

  // Search term keyboard navigation with autocomplete support
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (!showSearchSuggestions || searchSuggestions.length === 0) {
      if (e.key === 'Enter') handleSearch();
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSearchIndex((prev) =>
          prev < searchSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSearchIndex((prev) =>
          prev > 0 ? prev - 1 : searchSuggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSearchIndex >= 0) {
          const selected = searchSuggestions[selectedSearchIndex];
          selectSearchSuggestion(selected, selectedSearchIndex);
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

  const handleLocateMe = async () => {
    track({
      eventType: 'click',
      eventCategory: 'search',
      eventAction: 'locate_me_clicked',
      eventLabel: 'mobile_results_search',
    });

    const r = await locate();
    if (r?.display) {
      setLocation(r.display);
      hideSuggestions();
      if (r.latitude && r.longitude) {
        setGpsCoordinates({ lat: r.latitude, lng: r.longitude });
      }
    }
  };

  const handleClearLocation = () => {
    setLocation('');
    setLocationType(null);
    clearSuggestions();
    setGpsCoordinates(null);
  };

  return (
    <>
      {/* Collapsed summary bar */}
      <button
        type="button"
        onClick={toggleExpanded}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 border border-border hover:bg-secondary transition-colors text-left min-h-[44px]"
        aria-expanded={isExpanded}
        aria-label="Open search"
      >
        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className="flex-1 text-sm truncate text-foreground">
          {summaryText}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Expanded search panel - slides down below header */}
      {isExpanded && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={closePanel}
            aria-hidden="true"
          />

          {/* Panel */}
          <div
            ref={panelRef}
            className="fixed top-16 left-0 right-0 z-50 bg-background border-b border-border shadow-lg animate-in slide-in-from-top-2 duration-200"
          >
            <div className="p-4 space-y-3">
              {/* Search term input */}
              <div className="relative">
                <div className="relative flex items-center">
                  <Search className="absolute left-3 text-muted-foreground w-4 h-4 pointer-events-none z-10" />
                  <Input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search bars, restaurants..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    onFocus={() => {
                      if (searchTerm.length >= 2 && searchSuggestions.length > 0) {
                        setShowSearchSuggestions(true);
                      }
                    }}
                    className="pl-10 pr-10 h-11 text-sm border-input bg-secondary/30 rounded-lg"
                    autoFocus
                    autoComplete="off"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setShowSearchSuggestions(false);
                      }}
                      className="absolute right-3 text-muted-foreground hover:text-foreground transition-colors z-20 w-8 h-8 flex items-center justify-center"
                      type="button"
                      aria-label="Clear search"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Search term suggestions dropdown */}
                {showSearchSuggestions && searchSuggestions.length > 0 && (
                  <div
                    ref={searchSuggestionsRef}
                    className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto"
                  >
                    {searchSuggestions.map((suggestion, index) => (
                      <div
                        key={`${suggestion.type}-${suggestion.value}`}
                        className={`px-4 py-3 cursor-pointer border-b border-border/50 last:border-b-0 hover:bg-accent ${
                          index === selectedSearchIndex ? 'bg-accent' : ''
                        }`}
                        onClick={() => selectSearchSuggestion(suggestion, index)}
                      >
                        <span className="text-sm font-medium text-foreground">
                          {suggestion.displayValue}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Location input */}
              <div className="relative flex items-center">
                <MapPin className="absolute left-3 text-muted-foreground w-4 h-4 pointer-events-none z-10" />
                <Input
                  ref={locationInputRef}
                  type="text"
                  placeholder="City, State or ZIP"
                  value={location}
                  onChange={(e) => handleLocationChange(e.target.value)}
                  onKeyDown={handleLocationKeyDown}
                  className="pl-10 pr-20 h-11 text-sm border-input bg-secondary/30 rounded-lg"
                  autoComplete="off"
                />

                {/* Locate me button */}
                <button
                  type="button"
                  aria-label="Use my location"
                  onClick={handleLocateMe}
                  className="absolute right-10 text-muted-foreground hover:text-foreground transition-colors z-20 w-8 h-8 flex items-center justify-center"
                >
                  {isLocating ? (
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
                  ) : (
                    <LocateFixed className="w-4 h-4" />
                  )}
                </button>

                {/* Clear button */}
                {location && (
                  <button
                    onClick={handleClearLocation}
                    className="absolute right-3 text-muted-foreground hover:text-foreground transition-colors z-20 w-8 h-8 flex items-center justify-center"
                    type="button"
                    aria-label="Clear location"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                {/* Location suggestions dropdown */}
                {showSuggestions && locationSuggestions.length > 0 && (
                  <div
                    ref={suggestionsRef}
                    className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto"
                  >
                    {locationSuggestions.map((suggestion, index) => (
                      <div
                        key={suggestion.id}
                        className={`px-4 py-3 cursor-pointer border-b border-border/50 last:border-b-0 hover:bg-accent ${
                          index === selectedSuggestionIndex
                            ? 'bg-accent'
                            : ''
                        }`}
                        onClick={() => selectLocationSuggestion(suggestion)}
                      >
                        <div className="flex items-start">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-foreground">
                              {suggestion.text}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {suggestion.place_name}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground ml-2 shrink-0">
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
                className="w-full h-11 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold rounded-lg shadow-sm"
              >
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  );
};
