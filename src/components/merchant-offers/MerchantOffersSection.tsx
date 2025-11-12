import React, { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { OfferCard } from './OfferCard';
import { OfferDetailsModal } from './OfferDetailsModal';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAnalytics } from '@/hooks/useAnalytics';
import { MerchantOffer } from './types';

interface MerchantOffersSectionProps {
  restaurantId: number;
  offers: MerchantOffer[];
}

export const MerchantOffersSection: React.FC<MerchantOffersSectionProps> = ({ restaurantId, offers }) => {
  const { track } = useAnalytics();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(true);
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

  const handleToggle = async (newIsOpen: boolean) => {
    await track({
      eventType: 'click',
      eventCategory: 'merchant_interaction',
      eventAction: newIsOpen ? 'offers_expanded' : 'offers_collapsed',
      merchantId: restaurantId,
    });
    setIsOpen(newIsOpen);
  };

  if (!offers || offers.length === 0) {
    return null;
  }

  if (isMobile) {
    return (
      <div className="space-y-4">
        <Collapsible open={isOpen} onOpenChange={handleToggle}>
          <CollapsibleTrigger className="flex items-center justify-between w-full">
            <h3 className="text-lg font-semibold text-gray-900">Current Offers</h3>
            {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="grid gap-4 mt-4">
              {offers.map((offer) => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  onClick={() => handleOfferClick(offer)}
                />
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        <OfferDetailsModal
          offer={selectedOffer}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      </div>
    );
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