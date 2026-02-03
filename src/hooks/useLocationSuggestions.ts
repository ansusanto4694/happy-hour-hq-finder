import { useState, useRef, useCallback, useEffect, RefObject } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAnalytics } from '@/hooks/useAnalytics';
import { locationCache } from '@/utils/locationCache';

export interface LocationSuggestion {
  id: string;
  place_name: string;
  center: [number, number];
  place_type: string[];
  text: string;
  location_type: string;
}

interface UseLocationSuggestionsOptions {
  /** Debounce delay in ms (default: 400ms for mobile-friendly typing) */
  debounceMs?: number;
  /** Minimum characters before fetching suggestions (default: 2) */
  minChars?: number;
  /** Callback when a suggestion is selected */
  onSelect?: (suggestion: LocationSuggestion) => void;
}

interface UseLocationSuggestionsReturn {
  // State
  suggestions: LocationSuggestion[];
  isLoading: boolean;
  showSuggestions: boolean;
  selectedIndex: number;
  
  // Actions
  fetchSuggestions: (query: string) => void;
  selectSuggestion: (suggestion: LocationSuggestion) => void;
  handleKeyDown: (e: React.KeyboardEvent, onEnterWithoutSelection?: () => void) => void;
  clearSuggestions: () => void;
  hideSuggestions: () => void;
  
  // Refs for click-outside detection
  suggestionsRef: RefObject<HTMLDivElement>;
  
  // Cleanup for parent component
  cleanup: () => void;
}

export function useLocationSuggestions(
  options: UseLocationSuggestionsOptions = {}
): UseLocationSuggestionsReturn {
  const { debounceMs = 400, minChars = 2, onSelect } = options;
  const { track } = useAnalytics();
  
  // State
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  // Refs
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch suggestions from API
  const fetchSuggestionsInternal = useCallback(async (query: string) => {
    if (query.length < minChars) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Check cache first
    const cachedSuggestions = locationCache.get(query);
    if (cachedSuggestions) {
      setSuggestions(cachedSuggestions);
      setShowSuggestions(true);
      setSelectedIndex(-1);
      setIsLoading(false);
      return;
    }

    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('location-suggestions', {
        body: { query }
      });

      // Check if this request was aborted
      if (controller.signal.aborted) {
        return;
      }

      if (error) throw error;

      const newSuggestions = data.suggestions || [];
      
      // Cache the results
      locationCache.set(query, newSuggestions);
      
      setSuggestions(newSuggestions);
      setShowSuggestions(true);
      setSelectedIndex(-1);
      
      // Track suggestions displayed
      track({
        eventType: 'interaction',
        eventCategory: 'search',
        eventAction: 'location_suggestions_displayed',
        eventLabel: query,
        metadata: { suggestionCount: newSuggestions.length }
      });
    } catch (error: unknown) {
      // Check if aborted before handling error
      if (controller.signal.aborted) {
        return;
      }
      console.error('Error fetching location suggestions:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  }, [minChars, track]);

  // Debounced fetch
  const fetchSuggestions = useCallback((query: string) => {
    // Clear existing debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    // Debounce the API call
    debounceRef.current = setTimeout(() => {
      fetchSuggestionsInternal(query);
    }, debounceMs);
  }, [debounceMs, fetchSuggestionsInternal]);

  // Select a suggestion
  const selectSuggestion = useCallback((suggestion: LocationSuggestion) => {
    // Track suggestion selection
    track({
      eventType: 'click',
      eventCategory: 'search',
      eventAction: 'location_suggestion_selected',
      eventLabel: suggestion.place_name,
      metadata: { locationType: suggestion.location_type }
    });
    
    setShowSuggestions(false);
    setSelectedIndex(-1);
    
    // Call parent callback
    onSelect?.(suggestion);
  }, [track, onSelect]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((
    e: React.KeyboardEvent, 
    onEnterWithoutSelection?: () => void
  ) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        onEnterWithoutSelection?.();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
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
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
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
        if (selectedIndex >= 0) {
          selectSuggestion(suggestions[selectedIndex]);
        } else {
          onEnterWithoutSelection?.();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  }, [showSuggestions, suggestions, selectedIndex, selectSuggestion, track]);

  // Clear suggestions
  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  }, []);

  // Hide suggestions without clearing
  const hideSuggestions = useCallback(() => {
    setShowSuggestions(false);
    setSelectedIndex(-1);
  }, []);

  // Cleanup function for parent component
  const cleanup = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    suggestions,
    isLoading,
    showSuggestions,
    selectedIndex,
    fetchSuggestions,
    selectSuggestion,
    handleKeyDown,
    clearSuggestions,
    hideSuggestions,
    suggestionsRef,
    cleanup,
  };
}
