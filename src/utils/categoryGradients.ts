// Maps category slugs to gradient color pairs for hero backgrounds
// Returns HSL color values for use with Tailwind

interface GradientColors {
  from: string;
  to: string;
}

const categoryGradientMap: Record<string, GradientColors> = {
  // Food & Dining
  'restaurant': { from: '24 71% 53%', to: '33 100% 47%' }, // Orange to amber
  'bar': { from: '262 83% 58%', to: '271 91% 65%' }, // Purple to violet
  'cafe': { from: '25 95% 53%', to: '43 96% 56%' }, // Coffee brown to warm orange
  'fast-food': { from: '0 84% 60%', to: '12 76% 61%' }, // Red to orange-red
  'fine-dining': { from: '222 47% 11%', to: '217 33% 17%' }, // Deep navy to dark blue
  'pizza': { from: '0 72% 51%', to: '24 100% 50%' }, // Pizza red to orange
  'sushi': { from: '199 89% 48%', to: '187 85% 43%' }, // Ocean blue to teal
  'mexican': { from: '0 84% 60%', to: '29 93% 54%' }, // Red to warm orange
  'italian': { from: '142 76% 36%', to: '0 84% 60%' }, // Italian flag colors
  'asian': { from: '0 84% 60%', to: '45 93% 47%' }, // Red to gold
  'american': { from: '221 83% 53%', to: '0 84% 60%' }, // Blue to red
  'seafood': { from: '199 89% 48%', to: '187 85% 43%' }, // Ocean blues
  'steakhouse': { from: '0 59% 41%', to: '24 71% 53%' }, // Deep red to orange
  'bbq': { from: '0 59% 41%', to: '24 100% 50%' }, // BBQ red to orange
  'bakery': { from: '43 96% 56%', to: '54 91% 67%' }, // Warm yellow to light yellow
  
  // Nightlife & Entertainment
  'nightclub': { from: '262 83% 58%', to: '280 100% 70%' }, // Purple to magenta
  'lounge': { from: '280 100% 70%', to: '340 82% 52%' }, // Magenta to pink
  'brewery': { from: '25 95% 53%', to: '33 100% 47%' }, // Amber beer colors
  'winery': { from: '340 82% 52%', to: '350 89% 60%' }, // Wine purple to red
  'music-venue': { from: '262 83% 58%', to: '271 91% 65%' }, // Purple tones
  'sports-bar': { from: '142 76% 36%', to: '199 89% 48%' }, // Green to blue (sports)
  
  // Activities & Services
  'entertainment': { from: '271 91% 65%', to: '280 100% 70%' }, // Vibrant purples
  'shopping': { from: '340 82% 52%', to: '346 77% 60%' }, // Pink to light pink
  'hotel': { from: '221 83% 53%', to: '199 89% 48%' }, // Royal blue
  'spa': { from: '187 85% 43%', to: '174 62% 47%' }, // Calming teals
  'gym': { from: '0 84% 60%', to: '12 76% 61%' }, // Energetic red-orange
  'salon': { from: '340 82% 52%', to: '280 100% 70%' }, // Pink to purple
};

export const getCategoryGradient = (categorySlug?: string): GradientColors => {
  if (!categorySlug) {
    // Default brand gradient
    return { from: '24 71% 53%', to: '33 100% 47%' };
  }
  
  return categoryGradientMap[categorySlug.toLowerCase()] || { from: '24 71% 53%', to: '33 100% 47%' };
};

export const getCategoryGradientClass = (categorySlug?: string): string => {
  const { from, to } = getCategoryGradient(categorySlug);
  return `bg-gradient-to-br from-[hsl(${from})] to-[hsl(${to})]`;
};
