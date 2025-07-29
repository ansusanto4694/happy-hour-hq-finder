import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Tag } from 'lucide-react';
import { MerchantOffer } from './types';
import { format, isAfter, isBefore } from 'date-fns';

interface OfferCardProps {
  offer: MerchantOffer;
  onClick: () => void;
}

export const OfferCard: React.FC<OfferCardProps> = ({ offer, onClick }) => {
  const now = new Date();
  const startTime = new Date(offer.start_time);
  const endTime = new Date(offer.end_time);
  
  const isUpcoming = isBefore(now, startTime);
  const isActive = !isUpcoming && isBefore(now, endTime);
  
  const getStatusBadge = () => {
    if (isUpcoming) {
      return <Badge variant="secondary" className="text-xs">Upcoming</Badge>;
    }
    if (isActive) {
      return <Badge variant="default" className="text-xs bg-green-600">Active Now</Badge>;
    }
    return null;
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd');
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary/20"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Tag className="h-4 w-4 text-primary" />
              <h3 className="font-medium text-gray-900 truncate">
                {offer.offer_name}
              </h3>
              {getStatusBadge()}
            </div>
            
            {offer.offer_description && (
              <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                {offer.offer_description}
              </p>
            )}
            
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Calendar className="h-3 w-3" />
              <span>
                {formatDate(offer.start_time)} - {formatDate(offer.end_time)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};