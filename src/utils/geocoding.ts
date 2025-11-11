
import { supabase } from '@/integrations/supabase/client';

interface GeocodeResult {
  latitude: number;
  longitude: number;
  neighborhood?: string;
}

// Edge function geocoding using Supabase
export const geocodeAddress = async (address: string): Promise<GeocodeResult | null> => {
  try {
    const { data, error } = await supabase.functions.invoke('geocode-address', {
      body: { address }
    });

    if (error) {
      console.error('Geocoding error:', error);
      return null;
    }

    if (data && data.success) {
      return {
        latitude: data.latitude,
        longitude: data.longitude,
        neighborhood: data.neighborhood
      };
    }

    console.warn('Geocoding failed:', data?.error || 'Unknown error');
    return null;
  } catch (error) {
    console.error('Geocoding request failed:', error);
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
        neighborhood: coordinates.neighborhood || null,
        geocoded_at: new Date().toISOString()
      })
      .eq('id', merchantId);
    
    if (error) {
      console.error(`Failed to update coordinates for merchant ${merchantId}:`, error);
      return false;
    }
    
    console.log(`Successfully geocoded merchant ${merchantId}:`, coordinates);
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
      return { success: false, message: 'Failed to fetch merchants' };
    }
    
    if (!merchants || merchants.length === 0) {
      console.log('No merchants need geocoding');
      return { success: true, message: 'All merchants already have coordinates' };
    }
    
    console.log(`Starting geocoding for ${merchants.length} merchants`);
    
    let successCount = 0;
    let failureCount = 0;
    
    // Process merchants one by one to avoid rate limiting
    for (const merchant of merchants) {
      const fullAddress = `${merchant.street_address}, ${merchant.city}, ${merchant.state} ${merchant.zip_code}`;
      
      const success = await geocodeMerchant(merchant.id, fullAddress);
      if (success) {
        successCount++;
      } else {
        failureCount++;
      }
      
      // Add a small delay to avoid hitting rate limits
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log(`Batch geocoding completed. Success: ${successCount}, Failed: ${failureCount}`);
    return { 
      success: true, 
      message: `Geocoded ${successCount} restaurants successfully. ${failureCount} failed.` 
    };
  } catch (error) {
    console.error('Batch geocoding failed:', error);
    return { success: false, message: 'Geocoding process failed' };
  }
};
