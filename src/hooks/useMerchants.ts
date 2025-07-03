
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useMerchants = (categoryIds?: string[], searchTerm?: string, startTime?: string, endTime?: string) => {
  return useQuery({
    queryKey: ['merchants', categoryIds, searchTerm, startTime, endTime],
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
        `);

      let merchantIds: number[] | null = null;

      // If search term is provided, find merchants with matching happy hour deals
      if (searchTerm && searchTerm.trim()) {
        console.log('Searching for term:', searchTerm);
        
        const { data: dealMerchants, error: dealError } = await supabase
          .from('happy_hour_deals')
          .select('restaurant_id')
          .or(`deal_title.ilike.%${searchTerm}%,deal_description.ilike.%${searchTerm}%`)
          .eq('active', true);

        if (dealError) {
          console.error('Error searching happy hour deals:', dealError);
          throw dealError;
        }

        console.log('Found deals matching search:', dealMerchants);

        if (dealMerchants && dealMerchants.length > 0) {
          merchantIds = dealMerchants.map(deal => deal.restaurant_id);
          console.log('Merchant IDs from search:', merchantIds);
        } else {
          // No deals found for search term, return empty result
          console.log('No deals found for search term, returning empty');
          return [];
        }
      }

      // If category filters are applied, filter by them using OR logic
      if (categoryIds && categoryIds.length > 0) {
        console.log('Filtering by category IDs:', categoryIds);
        
        // Get merchant IDs that have ANY of the selected categories (OR logic)
        const { data: categoryMerchants, error: merchantIdsError } = await supabase
          .from('merchant_categories')
          .select('merchant_id')
          .in('category_id', categoryIds);

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
