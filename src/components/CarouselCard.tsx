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
      className="cursor-pointer hover:shadow-md transition-shadow duration-200 bg-card border border-border h-32"
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
        
        {/* Merchant Name */}
        <div className="flex-1 min-w-0 pt-2">
          <h3 className="font-semibold text-foreground text-lg leading-tight">
            {merchant.restaurant_name}
          </h3>
        </div>
      </CardContent>
    </Card>
  );
};