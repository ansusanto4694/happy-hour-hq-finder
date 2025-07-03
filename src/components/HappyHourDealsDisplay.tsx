import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';

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

  const preprocessMarkdown = (text: string) => {
    // Split by line breaks to handle each line individually
    const lines = text.split('\n');
    
    return lines.map(line => {
      // If line is empty or just whitespace, create an empty paragraph
      if (line.trim() === '') {
        return '\n&nbsp;\n';
      }
      // Otherwise, wrap the line content
      return line.trim();
    }).join('\n\n'); // Join with double line breaks for proper markdown paragraphs
  };

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
        <p className="text-gray-500 italic">No happy hour menu items available at the moment.</p>
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
                <div className="text-gray-700 text-sm prose prose-sm max-w-none">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => {
                        // Handle paragraphs with only non-breaking spaces (empty lines)
                        if (children === '&nbsp;') {
                          return <div className="h-4">&nbsp;</div>;
                        }
                        return <p className="mb-0 leading-normal">{children}</p>;
                      },
                      strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                      em: ({ children }) => <em className="italic">{children}</em>,
                      u: ({ children }) => <u className="underline">{children}</u>,
                      s: ({ children }) => <s className="line-through">{children}</s>,
                      h1: ({ children }) => <h1 className="text-lg font-bold mb-1 leading-normal">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-base font-bold mb-1 leading-normal">{children}</h2>,
                      small: ({ children }) => <small className="text-xs leading-normal">{children}</small>,
                      br: () => <br />,
                    }}
                    remarkPlugins={[]}
                    rehypePlugins={[]}
                  >
                    {preprocessMarkdown(deal.deal_description)}
                  </ReactMarkdown>
                </div>
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
