import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

interface CarouselCardProps {
  merchant: {
    id: number;
    restaurant_name: string;
    logo_url?: string | null;
  };
  onClick: (merchantId: string) => void;
}

export const CarouselCard: React.FC<CarouselCardProps> = ({ merchant, onClick }) => {
  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow duration-200 bg-card border border-border h-24"
      onClick={() => onClick(merchant.id.toString())}
    >
      <CardContent className="p-3 h-full flex items-center space-x-3">
        {/* Logo */}
        <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
          {merchant.logo_url ? (
            <img
              src={merchant.logo_url}
              alt={`${merchant.restaurant_name} logo`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <span className="text-primary font-semibold text-lg">
                {merchant.restaurant_name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        
        {/* Merchant Name */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground text-sm truncate">
            {merchant.restaurant_name}
          </h3>
        </div>
      </CardContent>
    </Card>
  );
};