import React from 'react';
import { Button } from '@/components/ui/button';
import { Phone, MapPin, Globe } from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useParams } from 'react-router-dom';
import { cn } from '@/lib/utils';

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
      <div className="flex items-center justify-around p-3 gap-3 max-w-screen-lg mx-auto">
        {/* Call Button - Green */}
        {phoneNumber && (
          <Button
            asChild
            size="mobile"
            className={cn(
              "flex-1 bg-success hover:bg-success/90 text-success-foreground shadow-md font-semibold"
            )}
            onClick={handlePhoneClick}
          >
            <a href={`tel:${phoneNumber}`} className="flex items-center justify-center">
              <Phone className="h-5 w-5 mr-2" />
              Call
            </a>
          </Button>
        )}
        
        {/* Directions Button - Bright Blue */}
        <Button
          asChild
          size="mobile"
          className={cn(
            "flex-1 bg-bright-blue hover:bg-bright-blue/90 text-white shadow-md font-semibold"
          )}
          onClick={handleDirectionsClick}
        >
          <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center">
            <MapPin className="h-5 w-5 mr-2" />
            Directions
          </a>
        </Button>

        {/* Website Button - Secondary */}
        {website && (
          <Button
            asChild
            variant="secondary"
            size="mobile"
            className={cn(
              "flex-1 shadow-md font-semibold"
            )}
            onClick={handleWebsiteClick}
          >
            <a href={formattedWebsite} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center">
              <Globe className="h-5 w-5 mr-2" />
              Website
            </a>
          </Button>
        )}
      </div>
    </div>
  );
};
