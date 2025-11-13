
import React from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useParams } from 'react-router-dom';
import { MapPin, Phone, Globe } from 'lucide-react';

interface RestaurantContactInfoProps {
  streetAddress: string;
  streetAddressLine2?: string | null;
  city: string;
  state: string;
  zipCode: string;
  phoneNumber?: string | null;
  website?: string | null;
}

export const RestaurantContactInfo: React.FC<RestaurantContactInfoProps> = ({
  streetAddress,
  streetAddressLine2,
  city,
  state,
  zipCode,
  phoneNumber,
  website
}) => {
  const { track, trackFunnel } = useAnalytics();
  const { id } = useParams();
  const merchantId = id ? parseInt(id, 10) : undefined;

  const handlePhoneClick = () => {
    track({
      eventType: 'click',
      eventCategory: 'merchant_interaction',
      eventAction: 'phone_clicked',
      merchantId,
      eventLabel: phoneNumber || undefined,
    });

    trackFunnel({
      funnelStep: 'contact_clicked',
      merchantId,
      stepOrder: 6
    });
  };

  const handleWebsiteClick = () => {
    track({
      eventType: 'click',
      eventCategory: 'merchant_interaction',
      eventAction: 'website_clicked',
      merchantId,
      eventLabel: website || undefined,
    });

    trackFunnel({
      funnelStep: 'contact_clicked',
      merchantId,
      stepOrder: 6
    });
  };

  const handleDirectionsClick = () => {
    track({
      eventType: 'click',
      eventCategory: 'merchant_interaction',
      eventAction: 'directions_clicked',
      merchantId,
      metadata: {
        address: `${streetAddress}, ${city}, ${state} ${zipCode}`,
      },
    });
  };

  const addressUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${streetAddress}, ${city}, ${state} ${zipCode}`
  )}`;

  return (
    <div className="space-y-6">
      {/* Address */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-5 h-5 text-bright-blue" />
          <h2 className="text-lg font-bold text-primary border-b-2 border-bright-blue/20 pb-1">Address</h2>
        </div>
        <a
          href={addressUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleDirectionsClick}
          className="text-foreground hover:text-bright-blue cursor-pointer transition-colors block"
        >
          <p>{streetAddress}</p>
          {streetAddressLine2 && (
            <p>{streetAddressLine2}</p>
          )}
          <p>{city}, {state} {zipCode}</p>
        </a>
      </div>

      {/* Phone Number */}
      {phoneNumber && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Phone className="w-5 h-5 text-bright-blue" />
            <h2 className="text-lg font-bold text-primary border-b-2 border-bright-blue/20 pb-1">Phone Number</h2>
          </div>
          <a 
            href={`tel:${phoneNumber}`}
            onClick={handlePhoneClick}
            className="text-foreground hover:text-bright-blue cursor-pointer transition-colors font-medium"
          >
            {phoneNumber}
          </a>
        </div>
      )}

      {/* Website */}
      {website && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-5 h-5 text-bright-blue" />
            <h2 className="text-lg font-bold text-primary border-b-2 border-bright-blue/20 pb-1">Website</h2>
          </div>
          <a 
            href={website.startsWith('http') ? website : `https://${website}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleWebsiteClick}
            className="text-bright-blue hover:text-bright-blue/80 underline break-words break-all font-medium"
          >
            {website}
          </a>
        </div>
      )}
    </div>
  );
};
