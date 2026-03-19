import React from 'react';
import { useManageEvents } from '@/hooks/useManageEvents';
import { useMerchantStoreHours } from '@/hooks/useMerchantStoreHours';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Store, CheckCircle2, AlertCircle } from 'lucide-react';
import type { PortalSection } from './PortalSidebar';

interface PortalDashboardProps {
  merchantId: number;
  merchantName: string;
  onNavigate: (section: PortalSection) => void;
}

export const PortalDashboard: React.FC<PortalDashboardProps> = ({ merchantId, merchantName, onNavigate }) => {
  const { events } = useManageEvents(merchantId);
  const { storeHours } = useMerchantStoreHours(merchantId);

  const { data: happyHours } = useQuery({
    queryKey: ['merchant-happy-hours-count', merchantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('merchant_happy_hour')
        .select('id')
        .eq('store_id', merchantId);
      if (error) throw error;
      return data;
    },
  });

  const { data: deals } = useQuery({
    queryKey: ['happy-hour-deals-count', merchantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('happy_hour_deals')
        .select('id')
        .eq('restaurant_id', merchantId)
        .eq('active', true);
      if (error) throw error;
      return data;
    },
  });

  const activeEvents = events?.filter(e => e.is_active).length ?? 0;
  const hasHappyHours = (happyHours?.length ?? 0) > 0;
  const hasDeals = (deals?.length ?? 0) > 0;
  const storeHoursSet = (storeHours?.length ?? 0) > 0;
  const storeHoursComplete = storeHoursSet && storeHours!.length >= 7;

  const cards = [
    {
      title: 'Events',
      icon: Calendar,
      value: `${activeEvents} active`,
      status: activeEvents > 0 ? 'good' : 'action',
      hint: activeEvents > 0 ? 'Looking good!' : 'Add events to attract visitors',
      section: 'events' as PortalSection,
    },
    {
      title: 'Happy Hours',
      icon: Clock,
      value: hasHappyHours ? `${happyHours!.length} time slots` : 'Not set',
      status: hasHappyHours ? 'good' : 'action',
      hint: hasHappyHours
        ? hasDeals ? `${deals!.length} menu items` : 'Add menu items'
        : 'Set your happy hour schedule',
      section: 'happy-hours' as PortalSection,
    },
    {
      title: 'Store Hours',
      icon: Store,
      value: storeHoursComplete ? 'Complete' : storeHoursSet ? 'Partial' : 'Not set',
      status: storeHoursComplete ? 'good' : 'action',
      hint: storeHoursComplete ? 'All 7 days configured' : 'Let customers know when you\'re open',
      section: 'store-hours' as PortalSection,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
        <p className="text-sm text-muted-foreground mt-1">Here's how your listing is doing</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(card => (
          <Card
            key={card.title}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onNavigate(card.section)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-foreground">{card.value}</span>
                {card.status === 'good' ? (
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-destructive" />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{card.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
