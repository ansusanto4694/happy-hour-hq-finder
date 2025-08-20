import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CarouselCardProps {
  merchant: {
    id: number;
    restaurant_name: string;
    logo_url?: string | null;
    merchant_categories?: Array<{
      id: string;
      categories: {
        name: string;
      };
    }>;
  };
  onClick: (merchantId: string) => void;
}

export const CarouselCard: React.FC<CarouselCardProps> = ({ merchant, onClick }) => {
  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow duration-200 bg-card border border-border h-40"
      onClick={() => onClick(merchant.id.toString())}
    >
      <CardContent className="p-4 h-full flex items-start space-x-4">
        {/* Logo */}
        <div className="flex-shrink-0 w-24 h-24 bg-white border border-border rounded-lg flex items-center justify-center overflow-hidden">
          {merchant.logo_url ? (
            <img
              src={merchant.logo_url}
              alt={`${merchant.restaurant_name} logo`}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <span className="text-primary font-semibold text-xl">
                {merchant.restaurant_name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        
        {/* Merchant Name and Categories */}
        <div className="flex-1 min-w-0 pt-2">
          <h3 className="font-semibold text-foreground text-lg leading-tight mb-2">
            {merchant.restaurant_name}
          </h3>
          
          {/* Categories */}
          {merchant.merchant_categories && merchant.merchant_categories.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {merchant.merchant_categories.slice(0, 3).map((merchantCategory) => (
                <Badge 
                  key={merchantCategory.id} 
                  variant="outline" 
                  className="text-xs px-2 py-1 font-normal"
                >
                  {merchantCategory.categories.name}
                </Badge>
              ))}
              {merchant.merchant_categories.length > 3 && (
                <Badge 
                  variant="outline" 
                  className="text-xs px-2 py-1 font-normal text-muted-foreground"
                >
                  +{merchant.merchant_categories.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};