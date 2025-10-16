import React, { useState } from 'react';
import { OfferCard } from './OfferCard';
import { OfferDetailsModal } from './OfferDetailsModal';
import { MerchantOffer } from './types';
import { useMerchantOffers } from '@/hooks/useMerchantOffers';
import { Skeleton } from '@/components/ui/skeleton';
import { useAnalytics } from '@/hooks/useAnalytics';

interface MerchantOffersSectionProps {
  restaurantId: number;
}

export const MerchantOffersSection: React.FC<MerchantOffersSectionProps> = ({ 
  restaurantId 
}) => {
  const { data: offers, isLoading } = useMerchantOffers(restaurantId);
  const { track } = useAnalytics();
  const [selectedOffer, setSelectedOffer] = useState<MerchantOffer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOfferClick = async (offer: MerchantOffer) => {
    await track({
      eventType: 'click',
      eventCategory: 'merchant_interaction',
      eventAction: 'offer_clicked',
      merchantId: restaurantId,
      metadata: {
        offerName: offer.offer_name,
        isActive: offer.is_active
      },
    });

    setSelectedOffer(offer);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOffer(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Current Offers</h3>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!offers || offers.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Current Offers</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {offers.map((offer) => (
          <OfferCard
            key={offer.id}
            offer={offer}
            onClick={() => handleOfferClick(offer)}
          />
        ))}
      </div>

      <OfferDetailsModal
        offer={selectedOffer}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};