
import { supabase } from '@/integrations/supabase/client';

interface GeocodeResult {
  latitude: number;
  longitude: number;
}

// Mapbox Geocoding API function
export const geocodeAddress = async (address: string): Promise<GeocodeResult | null> => {
  const MAPBOX_TOKEN = 'pk.eyJ1IjoiYW5zdXNhbnRvNDY5NCIsImEiOiJjbWNudDdob28weTZlMmtxMTBmbDc5YTM4In0.qwR9SIqDBrETlROMvhnKvw';
  
  try {
    const encodedAddress = encodeURIComponent(address);
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${MAPBOX_TOKEN}&limit=1`
    );
    
    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      const [longitude, latitude] = data.features[0].center;
      return { latitude, longitude };
    }
    
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};

// Function to geocode a single merchant
export const geocodeMerchant = async (merchantId: number, address: string) => {
  console.log(`Geocoding merchant ${merchantId}: ${address}`);
  
  const coordinates = await geocodeAddress(address);
  
  if (coordinates) {
    const { error } = await supabase
      .from('Merchant')
      .update({
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        geocoded_at: new Date().toISOString()
      })
      .eq('id', merchantId);
    
    if (error) {
      console.error(`Failed to update coordinates for merchant ${merchantId}:`, error);
      return false;
    }
    
    console.log(`Successfully geocoded merchant ${merchantId}`);
    return true;
  }
  
  console.warn(`Failed to geocode merchant ${merchantId}: ${address}`);
  return false;
};

// Function to batch geocode all merchants without coordinates
export const geocodeAllMerchants = async () => {
  try {
    // Get all merchants without coordinates
    const { data: merchants, error } = await supabase
      .from('Merchant')
      .select('id, restaurant_name, street_address, city, state, zip_code')
      .is('latitude', null);
    
    if (error) {
      console.error('Failed to fetch merchants for geocoding:', error);
      return;
    }
    
    if (!merchants || merchants.length === 0) {
      console.log('No merchants need geocoding');
      return;
    }
    
    console.log(`Starting geocoding for ${merchants.length} merchants`);
    
    // Process merchants one by one to avoid rate limiting
    for (const merchant of merchants) {
      const fullAddress = `${merchant.street_address}, ${merchant.city}, ${merchant.state} ${merchant.zip_code}`;
      
      await geocodeMerchant(merchant.id, fullAddress);
      
      // Add a small delay to avoid hitting rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('Batch geocoding completed');
  } catch (error) {
    console.error('Batch geocoding failed:', error);
  }
};
