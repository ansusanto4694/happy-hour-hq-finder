import React from 'react';
import { Button } from '@/components/ui/button';
import { Phone, MapPin, Globe } from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useParams } from 'react-router-dom';

interface MobileCTABarProps {
  phoneNumber?: string | null;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  website?: string | null;
}

export const MobileCTABar: React.FC<MobileCTABarProps> = ({
  phoneNumber,
  address,
  website,
}) => {
  const { track } = useAnalytics();
  const { id } = useParams();

  const handlePhoneClick = () => {
    track({
      eventType: 'click',
      eventCategory: 'merchant_interaction',
      eventAction: 'phone_clicked',
      merchantId: id ? parseInt(id) : undefined,
    });
  };

  const handleDirectionsClick = () => {
    track({
      eventType: 'click',
      eventCategory: 'merchant_interaction',
      eventAction: 'directions_clicked',
      merchantId: id ? parseInt(id) : undefined,
    });
  };

  const handleWebsiteClick = () => {
    track({
      eventType: 'click',
      eventCategory: 'merchant_interaction',
      eventAction: 'website_clicked',
      merchantId: id ? parseInt(id) : undefined,
    });
  };

  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`
  )}`;

  const formattedWebsite = website && !website.startsWith('http') 
    ? `https://${website}` 
    : website;

  const buttonCount = [phoneNumber, true, website].filter(Boolean).length;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-lg z-50 md:hidden">
      <div className="flex items-center justify-around p-3 gap-2 max-w-screen-lg mx-auto">
        {phoneNumber && (
          <Button
            asChild
            variant="default"
            size="mobile"
            className="flex-1"
            onClick={handlePhoneClick}
          >
            <a href={`tel:${phoneNumber}`}>
              <Phone className="h-4 w-4 mr-2" />
              Call
            </a>
          </Button>
        )}
        
        <Button
          asChild
          variant="default"
          size="mobile"
          className="flex-1"
          onClick={handleDirectionsClick}
        >
          <a href={directionsUrl} target="_blank" rel="noopener noreferrer">
            <MapPin className="h-4 w-4 mr-2" />
            Directions
          </a>
        </Button>

        {website && (
          <Button
            asChild
            variant="default"
            size="mobile"
            className="flex-1"
            onClick={handleWebsiteClick}
          >
            <a href={formattedWebsite} target="_blank" rel="noopener noreferrer">
              <Globe className="h-4 w-4 mr-2" />
              Website
            </a>
          </Button>
        )}
      </div>
    </div>
  );
};
