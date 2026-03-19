import React from 'react';
import { useManageEvents } from '@/hooks/useManageEvents';
import { useMerchantStoreHours } from '@/hooks/useMerchantStoreHours';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, Store, CheckCircle2, AlertCircle, Eye, Globe, MapPin, Phone, UtensilsCrossed, TrendingUp } from 'lucide-react';
import type { PortalSection } from './PortalSidebar';

interface PortalDashboardProps {
  merchantId: number;
  merchantName: string;
  onNavigate: (section: PortalSection) => void;
}

const StatCard: React.FC<{
  label: string;
  value: number;
  icon: React.ElementType;
  subtitle?: string;
}> = ({ label, value, icon: Icon, subtitle }) => (
  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
    <div className="flex items-center justify-center h-9 w-9 rounded-md bg-primary/10">
      <Icon className="h-4 w-4 text-primary" />
    </div>
    <div className="min-w-0">
      <p className="text-2xl font-bold text-foreground leading-none">{value.toLocaleString()}</p>
      <p className="text-xs text-muted-foreground mt-0.5 truncate">{label}</p>
      {subtitle && <p className="text-[10px] text-muted-foreground/70 truncate">{subtitle}</p>}
    </div>
  </div>
);

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

  // Merchant-specific traffic analytics (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: trafficStats } = useQuery({
    queryKey: ['merchant-traffic-stats', merchantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_events')
        .select('event_action')
        .eq('merchant_id', merchantId)
        .gte('created_at', thirtyDaysAgo)
        .in('event_action', [
          'page_view',
          'website_clicked',
          'directions_clicked',
          'phone_clicked',
          'deal_source_clicked',
          'result_card_clicked',
          'map_marker_clicked',
        ]);
      if (error) throw error;

      const counts: Record<string, number> = {};
      data?.forEach(e => {
        counts[e.event_action] = (counts[e.event_action] || 0) + 1;
      });
      return counts;
    },
    staleTime: 5 * 60 * 1000,
  });

  const activeEvents = events?.filter(e => e.is_active).length ?? 0;
  const hasHappyHours = (happyHours?.length ?? 0) > 0;
  const hasDeals = (deals?.length ?? 0) > 0;
  const storeHoursSet = (storeHours?.length ?? 0) > 0;
  const storeHoursComplete = storeHoursSet && storeHours!.length >= 7;

  const profileViews = trafficStats?.['page_view'] ?? 0;
  const websiteClicks = trafficStats?.['website_clicked'] ?? 0;
  const directionsClicks = trafficStats?.['directions_clicked'] ?? 0;
  const phoneClicks = trafficStats?.['phone_clicked'] ?? 0;
  const menuSourceClicks = trafficStats?.['deal_source_clicked'] ?? 0;
  const cardClicks = trafficStats?.['result_card_clicked'] ?? 0;
  const markerClicks = trafficStats?.['map_marker_clicked'] ?? 0;

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

      {/* Traffic Analytics */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <CardTitle className="text-base font-semibold">Visitor Activity</CardTitle>
            <span className="text-xs text-muted-foreground ml-auto">Last 30 days</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <StatCard label="Profile Views" value={profileViews} icon={Eye} />
            <StatCard label="Found via Search" value={cardClicks} icon={TrendingUp} subtitle="Clicked from results" />
            <StatCard label="Found on Map" value={markerClicks} icon={MapPin} subtitle="Clicked map pin" />
            <StatCard label="Website Clicks" value={websiteClicks} icon={Globe} />
            <StatCard label="Direction Requests" value={directionsClicks} icon={MapPin} />
            <StatCard label="Phone Calls" value={phoneClicks} icon={Phone} />
            <StatCard label="Menu Source Clicks" value={menuSourceClicks} icon={UtensilsCrossed} subtitle="Happy hour menu links" />
          </div>
        </CardContent>
      </Card>

      {/* Listing Health */}
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
