
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Helper function to generate accent variations for better accent matching
const generateAccentVariations = (term: string): string[] => {
  const variations = [term];
  
  // Map of base characters to their accented variations
  const accentMap: { [key: string]: string[] } = {
    'a': ['à', 'á', 'â', 'ã', 'ä', 'å', 'æ', 'ā', 'ă', 'ą'],
    'e': ['è', 'é', 'ê', 'ë', 'ē', 'ĕ', 'ė', 'ę', 'ě'],
    'i': ['ì', 'í', 'î', 'ï', 'ī', 'ĭ', 'į', 'ı'],
    'o': ['ò', 'ó', 'ô', 'õ', 'ö', 'ø', 'ō', 'ŏ', 'ő', 'œ'],
    'u': ['ù', 'ú', 'û', 'ü', 'ū', 'ŭ', 'ů', 'ű', 'ų'],
    'n': ['ñ', 'ń', 'ň', 'ņ'],
    'c': ['ç', 'ć', 'ĉ', 'ċ', 'č'],
    'y': ['ÿ', 'ý', 'ŷ'],
    's': ['š', 'ś', 'ŝ', 'ş'],
    'z': ['ž', 'ź', 'ż'],
    'd': ['đ', 'ď'],
    'l': ['ł', 'ľ', 'ļ', 'ĺ'],
    'r': ['ř', 'ŕ', 'ŗ'],
    't': ['ť', 'ţ']
  };
  
  // Create reverse mapping (accented to base)
  const reverseAccentMap: { [key: string]: string } = {};
  Object.entries(accentMap).forEach(([base, accents]) => {
    accents.forEach(accent => {
      reverseAccentMap[accent] = base;
    });
  });
  
  // Simple approach: for each character, try both accented and unaccented versions
  const words = term.toLowerCase().split(' ');
  
  words.forEach((word, wordIndex) => {
    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      
      // If character has accent variants, create variations
      if (accentMap[char]) {
        accentMap[char].forEach(accentChar => {
          const newWords = [...words];
          newWords[wordIndex] = word.substring(0, i) + accentChar + word.substring(i + 1);
          variations.push(newWords.join(' '));
        });
      }
      
      // If character is accented, create unaccented version
      if (reverseAccentMap[char]) {
        const newWords = [...words];
        newWords[wordIndex] = word.substring(0, i) + reverseAccentMap[char] + word.substring(i + 1);
        variations.push(newWords.join(' '));
      }
    }
  });
  
  return [...new Set(variations)];
};

// Helper function to generate search variations for better singular/plural matching
const generateSearchVariations = (term: string): string[] => {
  const variations = [term];
  const lowerTerm = term.toLowerCase();
  
  // Generate accent variations first
  const accentVariations = generateAccentVariations(lowerTerm);
  variations.push(...accentVariations);
  
  // Handle plural to singular for all variations
  const allVariations = [...new Set([...variations, ...accentVariations])];
  
  allVariations.forEach(variation => {
    // Split into words to handle each word's plural/singular forms
    const words = variation.split(' ');
    
    words.forEach((word, wordIndex) => {
      // Handle plural to singular - improved logic
      if (word.endsWith('s') && word.length > 1) {
        const newWords = [...words];
        
        // Handle different plural endings
        if (word.endsWith('ies') && word.length > 3) {
          // parties -> party
          newWords[wordIndex] = word.slice(0, -3) + 'y';
        } else if (word.endsWith('es') && word.length > 2) {
          // boxes -> box, dishes -> dish
          newWords[wordIndex] = word.slice(0, -2);
          variations.push(newWords.join(' '));
          // Also try just removing 's' for cases like "houses"
          newWords[wordIndex] = word.slice(0, -1);
        } else {
          // Simple case: restaurants -> restaurant
          newWords[wordIndex] = word.slice(0, -1);
        }
        variations.push(newWords.join(' '));
      }
      
      // Handle singular to plural - improved logic
      if (!word.endsWith('s')) {
        const newWords = [...words];
        
        // Handle different singular to plural patterns
        if (word.endsWith('y') && word.length > 1 && !'aeiou'.includes(word[word.length - 2])) {
          // party -> parties
          newWords[wordIndex] = word.slice(0, -1) + 'ies';
        } else if (word.endsWith('ch') || word.endsWith('sh') || word.endsWith('x') || word.endsWith('z') || word.endsWith('s')) {
          // box -> boxes, dish -> dishes
          newWords[wordIndex] = word + 'es';
        } else {
          // Simple case: restaurant -> restaurants
          newWords[wordIndex] = word + 's';
        }
        variations.push(newWords.join(' '));
      }
    });
  });
  
  // Handle common irregular plurals
  const irregularPlurals: { [key: string]: string } = {
    'child': 'children',
    'children': 'child',
    'foot': 'feet',
    'feet': 'foot',
    'tooth': 'teeth',
    'teeth': 'tooth',
    'man': 'men',
    'men': 'man',
    'woman': 'women',
    'women': 'woman',
    'person': 'people',
    'people': 'person',
    'mouse': 'mice',
    'mice': 'mouse'
  };
  
  allVariations.forEach(variation => {
    const words = variation.split(' ');
    words.forEach((word, wordIndex) => {
      if (irregularPlurals[word]) {
        const newWords = [...words];
        newWords[wordIndex] = irregularPlurals[word];
        variations.push(newWords.join(' '));
      }
    });
  });
  
  // Remove duplicates and limit variations to prevent database query issues
  const uniqueVariations = [...new Set(variations)];
  const limitedVariations = uniqueVariations.slice(0, 20); // Increased limit
  console.log('All unique search variations:', uniqueVariations);
  console.log('Limited search variations (first 20):', limitedVariations);
  return limitedVariations;
};

// Helper function to calculate distance between two coordinates using Haversine formula
const calculateHaversineDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
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

export const useMerchants = (categoryIds?: string[], searchTerm?: string, startTime?: string, endTime?: string, location?: string, bounds?: { north: number; south: number; east: number; west: number }, radiusMiles?: number) => {
  // Force fresh queries for restaurant searches to avoid caching issues
  const queryKey = ['merchants', categoryIds, searchTerm, startTime, endTime, location, bounds, radiusMiles];
  
  return useQuery({
    queryKey,
    staleTime: searchTerm?.toLowerCase().includes('restaurant') ? 0 : 5 * 60 * 1000, // Force fresh data for restaurant searches
    gcTime: searchTerm?.toLowerCase().includes('restaurant') ? 0 : 10 * 60 * 1000, // React Query v5 uses gcTime instead of cacheTime
    queryFn: async () => {
      console.log('=== STARTING MERCHANT SEARCH ===');
      console.log('Search parameters:', { categoryIds, searchTerm, startTime, endTime, location, bounds, radiusMiles });
      
      try {
      let query = supabase
        .from('Merchant')
        .select(`
          *,
          merchant_happy_hour (
            id,
            day_of_week,
            happy_hour_start,
            happy_hour_end
          ),
          merchant_categories (
            id,
            categories (
              id,
              name,
              slug,
              parent_id
            )
          )
        `)
        .eq('is_active', true);

      let merchantIds: number[] | null = null;

      // If search term is provided, find merchants with matching names, happy hour deals OR categories
      if (searchTerm && searchTerm.trim()) {
        console.log('Searching for term:', searchTerm);
        
        // Generate search variations for better singular/plural matching
        const searchVariations = generateSearchVariations(searchTerm.trim());
        console.log('Search variations for "' + searchTerm + '":', searchVariations);
        console.log('Number of search variations:', searchVariations.length);
        
        // Log specifically for restaurant/restaurants debugging
        if (searchTerm.toLowerCase().includes('restaurant')) {
          console.log('=== RESTAURANT SEARCH DEBUG ===');
          console.log('Original term:', searchTerm);
          console.log('Generated variations:', searchVariations);
          console.log('================================');
        }
        
        // Test accent variations specifically
        const accentTest = generateAccentVariations(searchTerm.trim().toLowerCase());
        console.log('Accent variations for "' + searchTerm + '":', accentTest);
        
        // Build OR conditions for all variations
        const nameSearchConditions = searchVariations.map(variation => `restaurant_name.ilike.%${variation}%`).join(',');
        console.log('Name search conditions:', nameSearchConditions);
        
        // Search in merchant names first
        const { data: nameMerchants, error: nameError } = await supabase
          .from('Merchant')
          .select('id')
          .or(nameSearchConditions)
          .eq('is_active', true);

        if (nameError) {
          console.error('Error searching merchant names:', nameError);
          throw nameError;
        }

        console.log('Found merchants matching name search:', nameMerchants);

        // Search in happy hour deals (only from active merchants)
        const dealSearchConditions = searchVariations.flatMap(variation => [
          `deal_title.ilike.%${variation}%`,
          `deal_description.ilike.%${variation}%`
        ]).join(',');
        
        const { data: dealMerchants, error: dealError } = await supabase
          .from('happy_hour_deals')
          .select(`
            restaurant_id,
            Merchant!inner(is_active)
          `)
          .or(dealSearchConditions)
          .eq('active', true)
          .eq('Merchant.is_active', true);

        if (dealError) {
          console.error('Error searching happy hour deals:', dealError);
          throw dealError;
        }

        console.log('Found deals matching search:', dealMerchants);

        // Search in categories
        const categorySearchConditions = searchVariations.map(variation => `name.ilike.%${variation}%`).join(',');
        console.log('Category search conditions:', categorySearchConditions);
        
        const { data: categoryMatches, error: categoryError } = await supabase
          .from('categories')
          .select('id')
          .or(categorySearchConditions);

        if (categoryError) {
          console.error('Error searching categories:', categoryError);
          throw categoryError;
        }

        console.log('Found categories matching search:', categoryMatches);
        console.log('Category matches count:', categoryMatches?.length || 0);

        // Get merchant IDs from matching categories
        let categoryMerchantIds: number[] = [];
        if (categoryMatches && categoryMatches.length > 0) {
          const categoryIds = categoryMatches.map(cat => cat.id);
          
          const { data: merchantsWithCategories, error: merchantCategoryError } = await supabase
            .from('merchant_categories')
            .select(`
              merchant_id,
              Merchant!inner(is_active)
            `)
            .in('category_id', categoryIds)
            .eq('Merchant.is_active', true);

          if (merchantCategoryError) {
            console.error('Error fetching merchants by categories:', merchantCategoryError);
            throw merchantCategoryError;
          }

          console.log('Found merchants with matching categories:', merchantsWithCategories);
          
          if (merchantsWithCategories && merchantsWithCategories.length > 0) {
            categoryMerchantIds = merchantsWithCategories.map(item => item.merchant_id);
          }
        }

        // Combine results from names, deals and categories (OR logic)
        const nameMerchantIds = nameMerchants ? nameMerchants.map(merchant => merchant.id) : [];
        const dealMerchantIds = dealMerchants ? dealMerchants.map(deal => deal.restaurant_id) : [];
        const allSearchMerchantIds = [...new Set([...nameMerchantIds, ...dealMerchantIds, ...categoryMerchantIds])];

        console.log('Combined search results - Name IDs:', nameMerchantIds);
        console.log('Combined search results - Deal IDs:', dealMerchantIds);
        console.log('Combined search results - Category IDs:', categoryMerchantIds);
        console.log('Combined search results - All IDs:', allSearchMerchantIds);

        if (allSearchMerchantIds.length > 0) {
          merchantIds = allSearchMerchantIds;
        } else {
          // No merchants, deals or categories found for search term, return empty result
          console.log('No merchants, deals or categories found for search term, returning empty');
          return [];
        }
      }

      // If category filters are applied, filter by them using OR logic
      if (categoryIds && categoryIds.length > 0) {
        console.log('Filtering by category IDs:', categoryIds);
        
        // Get merchant IDs that have ANY of the selected categories (OR logic)
        const { data: categoryMerchants, error: merchantIdsError } = await supabase
          .from('merchant_categories')
          .select(`
            merchant_id,
            Merchant!inner(is_active)
          `)
          .in('category_id', categoryIds)
          .eq('Merchant.is_active', true);

        if (merchantIdsError) {
          console.error('Error fetching merchant IDs:', merchantIdsError);
          throw merchantIdsError;
        }

        console.log('Found merchant IDs with categories:', categoryMerchants);

        if (categoryMerchants && categoryMerchants.length > 0) {
          const categoryMerchantIds = categoryMerchants.map(item => item.merchant_id);
          
          // If we also have search results, find intersection
          if (merchantIds !== null) {
            merchantIds = merchantIds.filter(id => categoryMerchantIds.includes(id));
          } else {
            merchantIds = categoryMerchantIds;
          }
        } else {
          // No merchants found for the selected categories, return empty result
          return [];
        }
      }

      // Apply location filter if provided (supports zip code, city, or city/state with geocoding)
      if (location && location.trim()) {
        console.log('Applying location filter:', location);
        const trimmedLocation = location.trim();
        
        // Parse location input
        const parseLocation = (input: string) => {
          // Check if it's a 5-digit zip code
          if (/^\d{5}$/.test(input)) {
            return { type: 'zip', value: input };
          }
          
          // For any other input, use geocoding service to normalize
          return { type: 'geocode', value: input };
        };
        
        const locationData = parseLocation(trimmedLocation);
        
        if (locationData.type === 'zip') {
          // If radius is specified, use geographic filtering instead of exact zip match
          if (radiusMiles !== undefined && radiusMiles > 0) {
            console.log(`Using radius-based search: ${radiusMiles} miles from zip ${locationData.value}`);
            
            // First, get coordinates for the zip code center
            try {
              const { data: geocodeResult, error: geocodeError } = await supabase.functions.invoke('geocode-address', {
                body: { address: locationData.value }
              });
              
              if (geocodeError || !geocodeResult?.success) {
                console.error('Failed to geocode zip code:', geocodeError || geocodeResult);
                // Fall back to exact zip match
                query = query.eq('zip_code', locationData.value);
              } else {
                const { latitude: centerLat, longitude: centerLng } = geocodeResult;
                console.log(`Zip code ${locationData.value} coordinates: ${centerLat}, ${centerLng}`);
                
                // Get all merchants with coordinates first, then filter by distance
                const allMerchantIds = merchantIds;
                const baseQuery = supabase
                  .from('Merchant')
                  .select('id, latitude, longitude')
                  .eq('is_active', true)
                  .not('latitude', 'is', null)
                  .not('longitude', 'is', null);
                
                // Apply existing merchant ID filters if any
                const coordQuery = allMerchantIds ? baseQuery.in('id', allMerchantIds) : baseQuery;
                
                const { data: merchantsWithCoords, error: coordError } = await coordQuery;
                
                if (coordError) {
                  console.error('Error fetching merchant coordinates:', coordError);
                  throw coordError;
                }
                
                if (!merchantsWithCoords) {
                  console.log('No merchants with coordinates found');
                  return [];
                }
                
                // Calculate distance for each merchant using Haversine formula
                const withinRadiusMerchants = merchantsWithCoords.filter(merchant => {
                  if (!merchant.latitude || !merchant.longitude) return false;
                  
                  const distance = calculateHaversineDistance(
                    centerLat, centerLng,
                    Number(merchant.latitude), Number(merchant.longitude)
                  );
                  
                  return distance <= radiusMiles;
                });
                
                console.log(`Found ${withinRadiusMerchants.length} merchants within ${radiusMiles} miles of zip ${locationData.value}`);
                
                if (withinRadiusMerchants.length === 0) {
                  return [];
                }
                
                // Update merchantIds to include only those within radius
                const radiusFilteredIds = withinRadiusMerchants.map(m => m.id);
                merchantIds = merchantIds ? merchantIds.filter(id => radiusFilteredIds.includes(id)) : radiusFilteredIds;
              }
            } catch (error) {
              console.error('Error in radius-based search:', error);
              // Fall back to exact zip match
              query = query.eq('zip_code', locationData.value);
            }
          } else {
            // No radius specified, use exact zip match
            query = query.eq('zip_code', locationData.value);
          }
        } else if (locationData.type === 'geocode') {
          // Call geocoding service to normalize location
          try {
            console.log('Calling geocoding service for:', locationData.value);
            const { data: geocodeResult, error: geocodeError } = await supabase.functions.invoke('normalize-location', {
              body: { location: locationData.value }
            });
            
            if (geocodeError) {
              console.error('Geocoding error:', geocodeError);
              // Fall back to simple city search if geocoding fails
              query = query.ilike('city', locationData.value);
          } else if (geocodeResult) {
            console.log('Geocoding result:', geocodeResult);
            const { canonical_city, canonical_state, location_type, north_lat, south_lat, east_lng, west_lng } = geocodeResult;
            
            // If we have a neighborhood with bounding box, use geographic filtering
            if (location_type === 'neighborhood' && north_lat && south_lat && east_lng && west_lng) {
              console.log('Using neighborhood bounding box filter:', { north_lat, south_lat, east_lng, west_lng });
              query = query
                .gte('latitude', south_lat)
                .lte('latitude', north_lat)
                .gte('longitude', west_lng)
                .lte('longitude', east_lng)
                .not('latitude', 'is', null)
                .not('longitude', 'is', null);
            } else {
              // Fall back to city/state filtering for cities and neighborhoods without bounds
              const originalCity = locationData.value.split(',')[0]?.trim() || locationData.value;
              
              if (canonical_city === 'New York' && originalCity.toLowerCase() === 'new york') {
                // "New York, NY" should include ALL NYC boroughs
                const nycBoroughs = ['New York', 'Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island'];
                const cityConditions = nycBoroughs.map(borough => `city.ilike.%${borough}%`).join(',');
                query = query.or(`and(or(${cityConditions}),state.ilike.%${canonical_state}%)`);
              } else {
                // Specific borough searches (Manhattan, Brooklyn, etc.) or other cities
                query = query.or(`and(city.ilike.%${canonical_city}%,state.ilike.%${canonical_state}%),and(city.ilike.%${originalCity}%,state.ilike.%${canonical_state}%)`);
              }
            }
          }
          } catch (error) {
            console.error('Failed to call geocoding service:', error);
            // Fall back to simple city search
            if (trimmedLocation.includes(',')) {
              const [city, state] = trimmedLocation.split(',').map(s => s.trim());
              query = query
                .ilike('city', city)
                .ilike('state', state);
            } else {
              query = query.ilike('city', trimmedLocation);
            }
          }
        }
      }

      // Apply geographic bounds filter if provided
      if (bounds) {
        console.log('Applying geographic bounds filter:', bounds);
        query = query
          .gte('latitude', bounds.south)
          .lte('latitude', bounds.north)
          .gte('longitude', bounds.west)
          .lte('longitude', bounds.east)
          .not('latitude', 'is', null)
          .not('longitude', 'is', null);
      }

      // Apply merchant ID filter if we have any filters
      if (merchantIds !== null) {
        if (merchantIds.length === 0) {
          console.log('No merchants match filters, returning empty');
          return [];
        }
        console.log('Filtering by merchant IDs:', merchantIds);
        query = query.in('id', merchantIds);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching merchants:', error);
        throw error;
      }

      console.log('Merchants before time filtering:', data);

      // Filter by happy hour times if both start and end times are provided
      if (startTime && endTime && data) {
        console.log(`Applying time filter: ${startTime} to ${endTime}`);
        
        const filteredData = data.filter(merchant => {
          // Check if merchant has any happy hours that overlap with the requested time range
          const hasOverlappingHour = merchant.merchant_happy_hour.some((happyHour: any) => {
            const hhStart = happyHour.happy_hour_start;
            const hhEnd = happyHour.happy_hour_end;
            
            console.log(`Checking merchant ${merchant.restaurant_name}: HH ${hhStart}-${hhEnd} vs requested ${startTime}-${endTime}`);
            
            // Convert times to minutes for easier comparison
            const parseTimeToMinutes = (timeStr: string) => {
              // Handle both 12-hour format (1:00 PM) and 24-hour format (13:00)
              let time = timeStr.trim();
              let hours, minutes;
              
              if (time.includes('AM') || time.includes('PM')) {
                // 12-hour format
                const isPM = time.includes('PM');
                time = time.replace(/AM|PM/g, '').trim();
                [hours, minutes] = time.split(':').map(Number);
                
                if (isPM && hours !== 12) {
                  hours += 12;
                } else if (!isPM && hours === 12) {
                  hours = 0;
                }
              } else {
                // 24-hour format
                [hours, minutes] = time.split(':').map(Number);
              }
              
              return hours * 60 + minutes;
            };
            
            const requestStart = parseTimeToMinutes(startTime);
            const requestEnd = parseTimeToMinutes(endTime);
            const happyStart = parseTimeToMinutes(hhStart);
            const happyEnd = parseTimeToMinutes(hhEnd);
            
            console.log(`Time comparison: requested ${requestStart}-${requestEnd} minutes vs happy hour ${happyStart}-${happyEnd} minutes`);
            
            // Check for overlap: ranges overlap if one starts before the other ends
            const hasOverlap = requestStart < happyEnd && requestEnd > happyStart;
            
            console.log(`Overlap result for ${merchant.restaurant_name}: ${hasOverlap}`);
            
            return hasOverlap;
          });
          
          console.log(`Final result for ${merchant.restaurant_name}: ${hasOverlappingHour}`);
          return hasOverlappingHour;
        });
        
        console.log('Merchants after time filtering:', filteredData);
        return filteredData;
      }

      console.log('Final merchants result:', data);
      console.log('Final merchants count:', data?.length || 0);
      
      // Extra debugging for restaurant searches
      if (searchTerm?.toLowerCase().includes('restaurant')) {
        console.log('🔍 RESTAURANT SEARCH FINAL RESULT:');
        console.log('- Search term:', searchTerm);
        console.log('- Result count:', data?.length || 0);
        console.log('- First few results:', data?.slice(0, 3));
        console.log('- Is result truthy?', !!data);
        console.log('- Is result an array?', Array.isArray(data));
      }
      
      return data;
      } catch (error) {
        console.error('=== SEARCH ERROR ===', error);
        throw error;
      }
    },
  });
};
