/**
 * Static search suggestions for typeahead functionality
 * Curated from categories, popular searches, and deal keywords
 */

export type SuggestionType = 'category' | 'popular' | 'deal';

export interface SearchSuggestion {
  type: SuggestionType;
  value: string;
  displayValue: string;
  priority: number;
  icon?: string;
}

export const searchSuggestions: SearchSuggestion[] = [
  // Categories (Priority 1 - Highest)
  { type: 'category', value: 'pizza', displayValue: 'Pizza', priority: 1, icon: '🍕' },
  { type: 'category', value: 'italian', displayValue: 'Italian', priority: 1, icon: '🍝' },
  { type: 'category', value: 'mexican', displayValue: 'Mexican', priority: 1, icon: '🌮' },
  { type: 'category', value: 'sushi', displayValue: 'Sushi', priority: 1, icon: '🍣' },
  { type: 'category', value: 'japanese', displayValue: 'Japanese', priority: 1, icon: '🍱' },
  { type: 'category', value: 'chinese', displayValue: 'Chinese', priority: 1, icon: '🥡' },
  { type: 'category', value: 'thai', displayValue: 'Thai', priority: 1, icon: '🍜' },
  { type: 'category', value: 'indian', displayValue: 'Indian', priority: 1, icon: '🍛' },
  { type: 'category', value: 'american', displayValue: 'American', priority: 1, icon: '🍔' },
  { type: 'category', value: 'bar', displayValue: 'Bar', priority: 1, icon: '🍺' },
  { type: 'category', value: 'cocktail-bar', displayValue: 'Cocktail Bar', priority: 1, icon: '🍸' },
  { type: 'category', value: 'bbq', displayValue: 'BBQ', priority: 1, icon: '🍖' },
  { type: 'category', value: 'brunch', displayValue: 'Brunch', priority: 1, icon: '🥞' },
  { type: 'category', value: 'seafood', displayValue: 'Seafood', priority: 1, icon: '🦞' },
  { type: 'category', value: 'steakhouse', displayValue: 'Steakhouse', priority: 1, icon: '🥩' },
  { type: 'category', value: 'french', displayValue: 'French', priority: 1, icon: '🥐' },
  { type: 'category', value: 'spanish', displayValue: 'Spanish', priority: 1, icon: '🥘' },
  { type: 'category', value: 'korean', displayValue: 'Korean', priority: 1, icon: '🍲' },
  { type: 'category', value: 'vietnamese', displayValue: 'Vietnamese', priority: 1, icon: '🍜' },
  { type: 'category', value: 'mediterranean', displayValue: 'Mediterranean', priority: 1, icon: '🫒' },
  { type: 'category', value: 'greek', displayValue: 'Greek', priority: 1, icon: '🧆' },
  { type: 'category', value: 'middle-eastern', displayValue: 'Middle Eastern', priority: 1, icon: '🥙' },
  { type: 'category', value: 'lebanese', displayValue: 'Lebanese', priority: 1, icon: '🥙' },
  { type: 'category', value: 'turkish', displayValue: 'Turkish', priority: 1, icon: '🥙' },
  { type: 'category', value: 'vegetarian', displayValue: 'Vegetarian', priority: 1, icon: '🥗' },
  { type: 'category', value: 'vegan', displayValue: 'Vegan', priority: 1, icon: '🌱' },
  { type: 'category', value: 'gluten-free', displayValue: 'Gluten-Free', priority: 1, icon: '🌾' },
  { type: 'category', value: 'sports-bar', displayValue: 'Sports Bar', priority: 1, icon: '⚽' },
  { type: 'category', value: 'wine-bar', displayValue: 'Wine Bar', priority: 1, icon: '🍷' },
  { type: 'category', value: 'rooftop', displayValue: 'Rooftop', priority: 1, icon: '🌆' },
  
  // Popular Search Terms (Priority 2)
  { type: 'popular', value: 'burgers', displayValue: 'Burgers', priority: 2, icon: '🔥' },
  { type: 'popular', value: 'happy hour', displayValue: 'Happy Hour', priority: 2, icon: '🔥' },
  { type: 'popular', value: 'tacos', displayValue: 'Tacos', priority: 2, icon: '🔥' },
  { type: 'popular', value: 'oysters', displayValue: 'Oysters', priority: 2, icon: '🔥' },
  { type: 'popular', value: 'wings', displayValue: 'Wings', priority: 2, icon: '🔥' },
  { type: 'popular', value: 'ramen', displayValue: 'Ramen', priority: 2, icon: '🔥' },
  { type: 'popular', value: 'dim sum', displayValue: 'Dim Sum', priority: 2, icon: '🔥' },
  { type: 'popular', value: 'pasta', displayValue: 'Pasta', priority: 2, icon: '🔥' },
  { type: 'popular', value: 'steak', displayValue: 'Steak', priority: 2, icon: '🔥' },
  
  // Deal Keywords (Priority 3)
  { type: 'deal', value: 'oyster hour', displayValue: 'Oyster Hour', priority: 3, icon: '💰' },
  { type: 'deal', value: 'taco tuesday', displayValue: 'Taco Tuesday', priority: 3, icon: '💰' },
  { type: 'deal', value: 'martini monday', displayValue: 'Martini Monday', priority: 3, icon: '💰' },
  { type: 'deal', value: 'wine specials', displayValue: 'Wine Specials', priority: 3, icon: '💰' },
  { type: 'deal', value: 'cocktail specials', displayValue: 'Cocktail Specials', priority: 3, icon: '💰' },
  { type: 'deal', value: 'late night', displayValue: 'Late Night Specials', priority: 3, icon: '💰' },
];

export const getSuggestionTypeLabel = (type: SuggestionType): string => {
  switch (type) {
    case 'category':
      return 'Category';
    case 'popular':
      return 'Popular';
    case 'deal':
      return 'Deal';
  }
};
