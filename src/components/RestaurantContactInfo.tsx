
import React from 'react';

interface RestaurantContactInfoProps {
  streetAddress: string;
  streetAddressLine2?: string | null;
  city: string;
  state: string;
  zipCode: string;
  phoneNumber?: string | null;
}

export const RestaurantContactInfo: React.FC<RestaurantContactInfoProps> = ({
  streetAddress,
  streetAddressLine2,
  city,
  state,
  zipCode,
  phoneNumber
}) => {
  return (
    <div className="space-y-6">
      {/* Address */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Address</h2>
        <div className="text-gray-700">
          <p>{streetAddress}</p>
          {streetAddressLine2 && (
            <p>{streetAddressLine2}</p>
          )}
          <p>{city}, {state} {zipCode}</p>
        </div>
      </div>

      {/* Phone Number */}
      {phoneNumber && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Phone Number</h2>
          <p className="text-gray-700">{phoneNumber}</p>
        </div>
      )}
    </div>
  );
};
