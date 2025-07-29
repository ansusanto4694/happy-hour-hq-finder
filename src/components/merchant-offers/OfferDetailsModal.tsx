import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MerchantOffer } from './types';
import { format } from 'date-fns';

interface OfferDetailsModalProps {
  offer: MerchantOffer | null;
  isOpen: boolean;
  onClose: () => void;
}

export const OfferDetailsModal: React.FC<OfferDetailsModalProps> = ({
  offer,
  isOpen,
  onClose
}) => {
  if (!offer) return null;

  const formatDateTime = (dateTimeString: string) => {
    return format(new Date(dateTimeString), 'MMM dd, yyyy • h:mm a');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="text-xl font-semibold text-gray-900">
            {offer.offer_name}
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <div className="space-y-4">
          {offer.offer_description && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Description</h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                {offer.offer_description}
              </p>
            </div>
          )}
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Offer Starts</p>
                <p className="text-sm text-gray-600">{formatDateTime(offer.start_time)}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Clock className="h-4 w-4 text-red-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Offer Ends</p>
                <p className="text-sm text-gray-600">{formatDateTime(offer.end_time)}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};