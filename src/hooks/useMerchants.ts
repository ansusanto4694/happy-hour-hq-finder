
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Helper function to generate search variations for better singular/plural matching
const generateSearchVariations = (term: string): string[] => {
  const variations = [term];
  const lowerTerm = term.toLowerCase();
  
  // Handle plural to singular
  if (lowerTerm.endsWith('s') && lowerTerm.length > 1) {
    variations.push(lowerTerm.slice(0, -1)); // Remove 's'
  }
  
  // Handle singular to plural
  if (!lowerTerm.endsWith('s')) {
    variations.push(lowerTerm + 's'); // Add 's'
  }
  
  // Handle common irregular plurals
  const irregularPlurals: { [key: string]: string[] } = {
    'child': ['children'],
    'children': ['child'],
    'foot': ['feet'],
    'feet': ['foot'],
    'tooth': ['teeth'],
    'teeth': ['tooth'],
    'man': ['men'],
    'men': ['man'],
    'woman': ['women'],
    'women': ['woman'],
    'person': ['people'],
    'people': ['person'],
    'mouse': ['mice'],
    'mice': ['mouse']
  };
  
  if (irregularPlurals[lowerTerm]) {
    variations.push(...irregularPlurals[lowerTerm]);
  }
  
  return [...new Set(variations)]; // Remove duplicates
};

export const useMerchants = (categoryIds?: string[], searchTerm?: string, startTime?: string, endTime?: string, location?: string, bounds?: { north: number; south: number; east: number; west: number }) => {
  return useQuery({
    queryKey: ['merchants', categoryIds, searchTerm, startTime, endTime, location, bounds],
    queryFn: async () => {
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
        console.log('Search variations:', searchVariations);
        
        // Build OR conditions for all variations
        const nameSearchConditions = searchVariations.map(variation => `restaurant_name.ilike.%${variation}%`).join(',');
        
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
        
        const { data: categoryMatches, error: categoryError } = await supabase
          .from('categories')
          .select('id')
          .or(categorySearchConditions);

        if (categoryError) {
          console.error('Error searching categories:', categoryError);
          throw categoryError;
        }

        console.log('Found categories matching search:', categoryMatches);

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
          query = query.eq('zip_code', locationData.value);
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
              const { canonical_city, canonical_state } = geocodeResult;
              
              // Handle NYC searches specially
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
      return data;
    },
  });
};
