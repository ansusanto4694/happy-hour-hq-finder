import { useMemo } from 'react';
import { searchSuggestions, type SearchSuggestion } from '@/data/searchSuggestions';
import { generateSearchVariations } from '@/utils/searchUtils';

interface UseSearchSuggestionsProps {
  query: string;
  maxResults?: number;
}

export const useSearchSuggestions = ({ query, maxResults = 7 }: UseSearchSuggestionsProps) => {
  const suggestions = useMemo(() => {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const normalizedQuery = query.trim().toLowerCase();
    const queryVariations = generateSearchVariations(normalizedQuery);
    
    // Score each suggestion based on match quality
    const scoredSuggestions = searchSuggestions
      .map(suggestion => {
        const normalizedValue = suggestion.value.toLowerCase();
        const normalizedDisplay = suggestion.displayValue.toLowerCase();
        
        let score = 0;
        
        // Check exact match (highest score)
        if (normalizedValue === normalizedQuery || normalizedDisplay === normalizedQuery) {
          score = 1000;
        }
        // Check if starts with query
        else if (normalizedValue.startsWith(normalizedQuery) || normalizedDisplay.startsWith(normalizedQuery)) {
          score = 500;
        }
        // Check word boundary match
        else if (
          normalizedValue.split(/\s+/).some(word => word.startsWith(normalizedQuery)) ||
          normalizedDisplay.split(/\s+/).some(word => word.startsWith(normalizedQuery))
        ) {
          score = 300;
        }
        // Check contains match
        else if (normalizedValue.includes(normalizedQuery) || normalizedDisplay.includes(normalizedQuery)) {
          score = 100;
        }
        // Check variations match (for plural/singular)
        else {
          for (const variation of queryVariations) {
            if (normalizedValue.includes(variation) || normalizedDisplay.includes(variation)) {
              score = 50;
              break;
            }
          }
        }
        
        // Boost score based on suggestion priority
        // Priority 1 (categories) get 3x boost
        // Priority 2 (popular) get 2x boost
        // Priority 3 (deals) get 1x boost
        const priorityMultiplier = suggestion.priority === 1 ? 3 : suggestion.priority === 2 ? 2 : 1;
        score *= priorityMultiplier;
        
        return {
          suggestion,
          score,
        };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => {
        // Sort by score (descending)
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        // If same score, sort by priority (ascending - lower number = higher priority)
        if (a.suggestion.priority !== b.suggestion.priority) {
          return a.suggestion.priority - b.suggestion.priority;
        }
        // If same priority, sort alphabetically
        return a.suggestion.displayValue.localeCompare(b.suggestion.displayValue);
      })
      .slice(0, maxResults)
      .map(item => item.suggestion);
    
    return scoredSuggestions;
  }, [query, maxResults]);

  return { suggestions };
};
