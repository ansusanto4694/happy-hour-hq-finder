import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getCategoryGradientClass } from '@/utils/categoryGradients';
import { UtensilsCrossed } from 'lucide-react';

interface MobileHeroSectionProps {
  restaurant: {
    restaurant_name: string;
    logo_url?: string | null;
    city: string;
    state: string;
    merchant_categories?: Array<{
      categories: {
        name: string;
        slug: string;
      };
    }>;
  };
}

export const MobileHeroSection: React.FC<MobileHeroSectionProps> = ({ restaurant }) => {
  // Get the first category for gradient selection
  const primaryCategory = restaurant.merchant_categories?.[0]?.categories;
  const gradientClass = getCategoryGradientClass(primaryCategory?.slug);
  
  // Get first letter for fallback
  const firstLetter = restaurant.restaurant_name.charAt(0).toUpperCase();
  
  return (
    <div className={`relative ${gradientClass} rounded-b-3xl shadow-xl mb-6 overflow-hidden`}>
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.5),transparent_50%)]" />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6 py-12 text-center">
        {/* Logo - Enlarged and elevated */}
        <div className="mb-5 animate-fade-in">
          <Avatar className="w-24 h-24 border-4 border-white shadow-2xl ring-4 ring-white/20">
            <AvatarImage 
              src={restaurant.logo_url || undefined} 
              alt={`${restaurant.restaurant_name} logo`}
              className="object-cover"
            />
            <AvatarFallback className={`${gradientClass} text-white text-3xl font-bold flex items-center justify-center`}>
              {restaurant.logo_url ? (
                firstLetter
              ) : (
                <div className="flex flex-col items-center">
                  <UtensilsCrossed className="w-8 h-8 mb-1" />
                  <span className="text-xs">{firstLetter}</span>
                </div>
              )}
            </AvatarFallback>
          </Avatar>
        </div>
        
        {/* Restaurant Name */}
        <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg animate-fade-in">
          {restaurant.restaurant_name}
        </h1>
        
        {/* Location Subtitle */}
        <p className="text-white/90 text-sm font-medium mb-5 drop-shadow animate-fade-in">
          {restaurant.city}, {restaurant.state}
        </p>
        
        {/* Category Badges */}
        {restaurant.merchant_categories && restaurant.merchant_categories.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center animate-fade-in">
            {restaurant.merchant_categories.slice(0, 3).map(({ categories }) => (
              <Badge 
                key={categories.slug}
                variant="secondary"
                className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30 transition-all"
              >
                {categories.name}
              </Badge>
            ))}
            {restaurant.merchant_categories.length > 3 && (
              <Badge 
                variant="secondary"
                className="bg-white/20 backdrop-blur-sm text-white border-white/30"
              >
                +{restaurant.merchant_categories.length - 3}
              </Badge>
            )}
          </div>
        )}
      </div>
      
      {/* Bottom gradient fade for smooth transition */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background/5 to-transparent" />
    </div>
  );
};
