
import React from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useParams } from 'react-router-dom';

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

  const handlePhoneClick = async () => {
    await track({
      eventType: 'click',
      eventCategory: 'merchant_interaction',
      eventAction: 'phone_clicked',
      merchantId,
      eventLabel: phoneNumber || undefined,
    });

    await trackFunnel({
      funnelStep: 'contact_clicked',
      merchantId,
      stepOrder: 6
    });
  };

  const handleWebsiteClick = async () => {
    await track({
      eventType: 'click',
      eventCategory: 'merchant_interaction',
      eventAction: 'website_clicked',
      merchantId,
      eventLabel: website || undefined,
    });

    await trackFunnel({
      funnelStep: 'contact_clicked',
      merchantId,
      stepOrder: 6
    });
  };

  const handleDirectionsClick = async () => {
    await track({
      eventType: 'click',
      eventCategory: 'merchant_interaction',
      eventAction: 'directions_clicked',
      merchantId,
    });
  };

  const addressUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${streetAddress}, ${city}, ${state} ${zipCode}`
  )}`;

  return (
    <div className="space-y-6">
      {/* Address */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Address</h2>
        <a
          href={addressUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleDirectionsClick}
          className="text-gray-700 hover:text-blue-600 cursor-pointer transition-colors"
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
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Phone Number</h2>
          <a 
            href={`tel:${phoneNumber}`}
            onClick={handlePhoneClick}
            className="text-gray-700 hover:text-blue-600 cursor-pointer transition-colors"
          >
            {phoneNumber}
          </a>
        </div>
      )}

      {/* Website */}
      {website && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Website</h2>
          <a 
            href={website.startsWith('http') ? website : `https://${website}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleWebsiteClick}
            className="text-blue-600 hover:text-blue-800 underline break-words break-all"
          >
            {website}
          </a>
        </div>
      )}
    </div>
  );
};
