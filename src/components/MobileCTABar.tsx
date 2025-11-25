import React from 'react';
import { Button } from '@/components/ui/button';
import { Phone, MapPin, Globe } from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { getDeviceType } from '@/utils/analytics';

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
  const { track, trackFunnel } = useAnalytics();
  const { id } = useParams();

  const handlePhoneClick = () => {
    const merchantId = id ? parseInt(id) : undefined;
    
    track({
      eventType: 'click',
      eventCategory: 'merchant_interaction',
      eventAction: 'phone_clicked',
      merchantId,
      metadata: {
        deviceType: getDeviceType(),
        component: 'mobile_cta_bar',
        phoneNumber: phoneNumber || undefined
      }
    });
    
    trackFunnel({
      funnelStep: 'contact_clicked',
      merchantId,
      stepOrder: 6
    });
  };

  const handleDirectionsClick = () => {
    const merchantId = id ? parseInt(id) : undefined;
    
    track({
      eventType: 'click',
      eventCategory: 'merchant_interaction',
      eventAction: 'directions_clicked',
      merchantId,
      metadata: {
        deviceType: getDeviceType(),
        component: 'mobile_cta_bar',
        address: `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`
      }
    });
    
    trackFunnel({
      funnelStep: 'contact_clicked',
      merchantId,
      stepOrder: 6
    });
  };

  const handleWebsiteClick = () => {
    const merchantId = id ? parseInt(id) : undefined;
    
    track({
      eventType: 'click',
      eventCategory: 'merchant_interaction',
      eventAction: 'website_clicked',
      merchantId,
      metadata: {
        deviceType: getDeviceType(),
        component: 'mobile_cta_bar',
        website: website || undefined
      }
    });
    
    trackFunnel({
      funnelStep: 'contact_clicked',
      merchantId,
      stepOrder: 6
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
      <div className="flex items-center justify-around p-2 gap-2 max-w-screen-lg mx-auto">
        {/* Call Button - Green */}
        {phoneNumber && (
          <Button
            asChild
            size="mobile"
            className={cn(
              "flex-1 bg-success hover:bg-success/90 text-success-foreground shadow-md font-semibold text-xs h-14"
            )}
            onClick={handlePhoneClick}
          >
            <a href={`tel:${phoneNumber}`} className="flex flex-col items-center justify-center gap-1">
              <Phone className="h-4 w-4" />
              <span>Call</span>
            </a>
          </Button>
        )}
        
        {/* Directions Button - Amber */}
        <Button
          asChild
          size="mobile"
          className={cn(
            "flex-1 bg-amber-500 hover:bg-amber-600 text-white shadow-md font-semibold text-xs h-14"
          )}
          onClick={handleDirectionsClick}
        >
          <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center gap-1">
            <MapPin className="h-4 w-4" />
            <span>Directions</span>
          </a>
        </Button>

        {/* Website Button - Secondary */}
        {website && (
          <Button
            asChild
            variant="secondary"
            size="mobile"
            className={cn(
              "flex-1 shadow-md font-semibold text-xs h-14"
            )}
            onClick={handleWebsiteClick}
          >
            <a href={formattedWebsite} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center gap-1">
              <Globe className="h-4 w-4" />
              <span>Website</span>
            </a>
          </Button>
        )}
      </div>
    </div>
  );
};
