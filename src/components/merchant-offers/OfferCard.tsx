import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MerchantOffer } from './types';

interface OfferCardProps {
  offer: MerchantOffer;
  onClick: () => void;
}

export const OfferCard: React.FC<OfferCardProps> = ({ offer, onClick }) => {
  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary/20"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <h3 className="font-medium text-gray-900">
          {offer.offer_name}
        </h3>
      </CardContent>
    </Card>
  );
};