import React from 'react';
import { DealsList } from '@/components/happy-hour-deals/DealsList';
import { HappyHourDeal } from '@/components/happy-hour-deals/types';
import { Badge } from '@/components/ui/badge';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { format } from 'date-fns';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useParams } from 'react-router-dom';

interface HappyHourDealsDisplayProps {
  restaurantId: number;
  deals: HappyHourDeal[];
}

export const HappyHourDealsDisplay: React.FC<HappyHourDealsDisplayProps> = ({ restaurantId, deals }) => {
  const { track } = useAnalytics();
  const { id } = useParams();
  const merchantId = id ? parseInt(id, 10) : restaurantId;

  if (!deals || deals.length === 0) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <p className="text-gray-500 italic">No happy hour menu items available at the moment.</p>
      </div>
    );
  }

  const preprocessMarkdown = (text: string) => {
    const lines = text.split('\n');
    
    return lines.map(line => {
      if (line.trim() === '') {
        return '\n&nbsp;\n';
      }
      return line.trim();
    }).join('\n\n');
  };

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
