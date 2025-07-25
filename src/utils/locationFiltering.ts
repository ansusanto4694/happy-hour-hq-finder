import { supabase } from '@/integrations/supabase/client';

// Helper function to calculate distance between two coordinates using Haversine formula
export const calculateHaversineDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance; // Distance in miles
};

export const getLocationCoordinates = async (location: string) => {
  console.log('Getting coordinates for location:', location);
  
  try {
    // First, try to get coordinates from cache
    let locationData = null;
    const { data: cachedLocation, error: cacheError } = await supabase
      .from('location_cache')
      .select('latitude, longitude')
      .eq('original_input', location.trim().toLowerCase())
      .single();

    if (!cacheError && cachedLocation) {
      locationData = cachedLocation;
      console.log('Found location in cache:', locationData);
    } else {
      console.log('Location not in cache, normalizing:', location);
      
      // Normalize the location using the edge function
      const { data: normalizedLocation, error: normalizeError } = await supabase.functions.invoke('normalize-location', {
        body: { location }
      });

      if (normalizeError) {
        console.error('Error normalizing location:', normalizeError);
        console.log('Skipping radius filter due to normalization error');
        return null;
      } else if (normalizedLocation) {
        locationData = {
          latitude: normalizedLocation.latitude,
          longitude: normalizedLocation.longitude
        };
        console.log('Normalized location:', locationData);
      }
    }

    return locationData;
  } catch (error) {
    console.error('Error getting location coordinates:', error);
    return null;
  }
};

export const filterMerchantsByRadius = async (merchants: any[], location: string, radiusMiles: number) => {
  console.log('Applying radius filtering:', radiusMiles, 'miles from', location);
  
  const locationData = await getLocationCoordinates(location);
  
  if (!locationData) {
    console.log('Could not get location coordinates for radius filtering, returning empty results');
    return [];
  }

  const filteredData = merchants.filter(merchant => {
    if (!merchant.latitude || !merchant.longitude) return false;
    
    const distance = calculateHaversineDistance(
      locationData.latitude,
      locationData.longitude,
      parseFloat(merchant.latitude.toString()),
      parseFloat(merchant.longitude.toString())
    );
    
    console.log(`Distance from ${merchant.restaurant_name}: ${distance.toFixed(2)} miles`);
    return distance <= radiusMiles;
  });
  
  console.log(`Merchants after radius filtering (${radiusMiles} miles):`, filteredData?.length || 0);
  return filteredData;
};