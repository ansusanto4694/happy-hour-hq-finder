/**
 * Search utilities for normalizing search terms and handling plural/singular variations
 */

/**
 * Simple and reliable function to generate both singular and plural forms of search terms
 */
export const generateSearchVariations = (searchTerm: string): string[] => {
  if (!searchTerm || !searchTerm.trim()) {
    return [];
  }

  const normalizedTerm = searchTerm.trim().toLowerCase();
  const variations = new Set<string>();
  
  // Always include the original term
  variations.add(normalizedTerm);
  
  // Split by spaces to handle multiple words
  const words = normalizedTerm.split(/\s+/);
  
  // Generate variations for each word
  const wordVariations = words.map(word => {
    const wordSet = new Set<string>();
    wordSet.add(word);
    
    // Handle plural to singular
    if (word.endsWith('s') && word.length > 1) {
      // Common plural patterns
      if (word.endsWith('ies') && word.length > 3) {
        // berries -> berry
        wordSet.add(word.slice(0, -3) + 'y');
      } else if (word.endsWith('es') && word.length > 2) {
        // dishes -> dish, boxes -> box
        const withoutEs = word.slice(0, -2);
        wordSet.add(withoutEs);
        // Also try without just 's' for words like "houses" -> "house"
        wordSet.add(word.slice(0, -1));
      } else {
        // Simple plural: restaurants -> restaurant, burgers -> burger
        wordSet.add(word.slice(0, -1));
      }
    }
    
    // Handle singular to plural
    if (!word.endsWith('s')) {
      if (word.endsWith('y') && word.length > 1 && !'aeiou'.includes(word[word.length - 2])) {
        // berry -> berries
        wordSet.add(word.slice(0, -1) + 'ies');
      } else if (word.endsWith('ch') || word.endsWith('sh') || word.endsWith('x') || word.endsWith('z')) {
        // dish -> dishes, box -> boxes
        wordSet.add(word + 'es');
      } else {
        // Simple singular: restaurant -> restaurants, burger -> burgers
        wordSet.add(word + 's');
      }
    }
    
    return Array.from(wordSet);
  });
  
  // Generate all combinations
  const generateCombinations = (arrays: string[][], index: number = 0): string[][] => {
    if (index >= arrays.length) {
      return [[]];
    }
    
    const current = arrays[index];
    const rest = generateCombinations(arrays, index + 1);
    const result: string[][] = [];
    
    for (const item of current) {
      for (const combination of rest) {
        result.push([item, ...combination]);
      }
    }
    
    return result;
  };
  
  const combinations = generateCombinations(wordVariations);
  for (const combination of combinations) {
    variations.add(combination.join(' '));
  }
  
  // Remove empty strings and return unique variations
  return Array.from(variations).filter(v => v.trim().length > 0);
};

/**
 * Create database-ready search conditions for Supabase
 */
export const createSearchConditions = (searchTerm: string, field: string): string => {
  const variations = generateSearchVariations(searchTerm);
  return variations.map(variation => `${field}.ilike.%${variation}%`).join(',');
};

/**
 * Debug function to show what variations are generated for a search term
 */
export const debugSearchVariations = (searchTerm: string): void => {
  const variations = generateSearchVariations(searchTerm);
  console.log(`Search variations for "${searchTerm}":`, variations);
};