
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface HappyHourDealsDisplayProps {
  restaurantId: number;
}

interface HappyHourDeal {
  id: string;
  deal_title: string;
  deal_description: string | null;
  active: boolean;
}

export const HappyHourDealsDisplay: React.FC<HappyHourDealsDisplayProps> = ({ restaurantId }) => {
  const { data: deals, isLoading } = useQuery({
    queryKey: ['happy-hour-deals', restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('happy_hour_deals')
        .select('id, deal_title, deal_description, active')
        .eq('restaurant_id', restaurantId)
        .eq('active', true)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching happy hour deals:', error);
        throw error;
      }

      return data as HappyHourDeal[];
    },
  });

  if (isLoading) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <p className="text-gray-500 italic">Loading deals...</p>
      </div>
    );
  }

  if (!deals || deals.length === 0) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <p className="text-gray-500 italic">No happy hour deals available at the moment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {deals.map((deal) => (
        <div key={deal.id} className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">{deal.deal_title}</h3>
              {deal.deal_description && (
                <p className="text-gray-700 text-sm whitespace-pre-line">{deal.deal_description}</p>
              )}
            </div>
            <Badge variant="secondary" className="ml-3 bg-orange-100 text-orange-800">
              Deal
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
};
