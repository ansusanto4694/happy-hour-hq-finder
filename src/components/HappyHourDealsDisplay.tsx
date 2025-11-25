import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { format } from 'date-fns';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useParams } from 'react-router-dom';
import { getDeviceType } from '@/utils/analytics';

interface HappyHourDealsDisplayProps {
  restaurantId: number;
}

interface HappyHourDeal {
  id: string;
  deal_title: string;
  deal_description: string | null;
  active: boolean;
  is_verified: boolean;
  verified_at: string | null;
  source_url: string | null;
  source_label: string | null;
}

export const HappyHourDealsDisplay: React.FC<HappyHourDealsDisplayProps> = ({ restaurantId }) => {
  const { track } = useAnalytics();
  const { id } = useParams();
  const merchantId = id ? parseInt(id, 10) : restaurantId;

  const { data: deals, isLoading } = useQuery({
    queryKey: ['happy-hour-deals', restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('happy_hour_deals')
        .select('id, deal_title, deal_description, active, is_verified, verified_at, source_url, source_label')
        .eq('restaurant_id', restaurantId)
        .eq('active', true)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching happy hour deals:', error);
        throw error;
      }

      // Track happy hour deal views
      if (data && data.length > 0) {
        track({
          eventType: 'impression',
          eventCategory: 'merchant_interaction',
          eventAction: 'happy_hour_deals_viewed',
          merchantId,
          metadata: {
            dealCount: data.length,
            verifiedCount: data.filter(d => d.is_verified).length,
            deviceType: getDeviceType()
          },
        });
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
        <div 
          key={deal.id} 
          className="bg-orange-50 p-4 rounded-lg border border-orange-200"
          onClick={() => {
            // Track individual deal clicks
            track({
              eventType: 'click',
              eventCategory: 'merchant_interaction',
              eventAction: 'happy_hour_deal_clicked',
              merchantId,
              eventLabel: deal.deal_title,
              metadata: {
                dealId: deal.id,
                isVerified: deal.is_verified,
                deviceType: getDeviceType()
              },
            });
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900 break-words">{deal.deal_title}</h3>
                {deal.is_verified && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800 flex-shrink-0">Verified</Badge>
                )}
                {deal.source_url && (
                  <a
                    href={deal.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      e.stopPropagation();
                      track({
                        eventType: 'click',
                        eventCategory: 'merchant_interaction',
                        eventAction: 'deal_source_clicked',
                        merchantId,
                        eventLabel: deal.source_url,
                        metadata: {
                          dealId: deal.id,
                          sourceLabel: deal.source_label,
                          deviceType: getDeviceType()
                        },
                      });
                    }}
                    className="text-xs text-blue-700 underline break-all max-w-full"
                    title={deal.source_url}
                  >
                    {deal.source_label || "Source"}
                  </a>
                )}
              </div>
              {deal.is_verified && deal.verified_at && (
                <div className="text-xs text-gray-500 mt-0.5 break-words">
                  Last verified on {format(new Date(deal.verified_at), "MMM d, yyyy")}
                </div>
              )}
              {deal.deal_description && (
                <div className="text-gray-700 text-sm prose prose-sm max-w-none break-words overflow-hidden">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => {
                        // Handle paragraphs with only non-breaking spaces (empty lines)
                        if (children === "&nbsp;") {
                          return <div className="h-4">&nbsp;</div>;
                        }
                        return <p className="mb-0 leading-normal break-words">{children}</p>;
                      },
                      strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                      em: ({ children }) => <em className="italic">{children}</em>,
                      u: ({ children }) => <u className="underline">{children}</u>,
                      s: ({ children }) => <s className="line-through">{children}</s>,
                      h1: ({ children }) => <h1 className="text-lg font-bold mb-1 leading-normal break-words">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-base font-bold mb-1 leading-normal break-words">{children}</h2>,
                      small: ({ children }) => <small className="text-xs leading-normal break-words">{children}</small>,
                      br: () => <br />,
                      a: ({ href, children }) => (
                        <a 
                          href={href} 
                          className="text-blue-700 underline break-all" 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          {children}
                        </a>
                      ),
                    }}
                    remarkPlugins={[]}
                    rehypePlugins={[rehypeRaw]}
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
