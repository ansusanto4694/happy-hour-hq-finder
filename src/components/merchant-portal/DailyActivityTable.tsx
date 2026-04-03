import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TrendingUp, Loader2 } from 'lucide-react';
import { format, subDays, eachDayOfInterval, startOfDay } from 'date-fns';

interface DailyActivityTableProps {
  merchantId: number;
}

const EVENT_ACTIONS = [
  'page_view',
  'website_clicked',
  'directions_clicked',
  'phone_clicked',
  'deal_source_clicked',
  'result_card_clicked',
  'map_marker_clicked',
  'profile_shared',
] as const;

const COLUMN_LABELS: Record<string, string> = {
  page_view: 'Views',
  result_card_clicked: 'Search Clicks',
  map_marker_clicked: 'Map Clicks',
  website_clicked: 'Website',
  directions_clicked: 'Directions',
  phone_clicked: 'Calls',
  deal_source_clicked: 'Menu Links',
  profile_shared: 'Shares',
};

export const DailyActivityTable: React.FC<DailyActivityTableProps> = ({ merchantId }) => {
  const thirtyDaysAgo = subDays(new Date(), 30).toISOString();

  const { data: events, isLoading } = useQuery({
    queryKey: ['merchant-daily-activity', merchantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_events')
        .select('event_action, created_at, session_id')
        .eq('merchant_id', merchantId)
        .gte('created_at', thirtyDaysAgo)
        .in('event_action', [...EVENT_ACTIONS]);
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Build daily breakdown
  const days = eachDayOfInterval({
    start: subDays(new Date(), 29),
    end: new Date(),
  }).reverse(); // most recent first

  const dailyData = days.map(day => {
    const dayStart = startOfDay(day);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    const dayEvents = events?.filter(e => {
      const t = new Date(e.created_at);
      return t >= dayStart && t < dayEnd;
    }) ?? [];

    const counts: Record<string, number> = {};
    const sessions = new Set<string>();

    dayEvents.forEach(e => {
      counts[e.event_action] = (counts[e.event_action] || 0) + 1;
      sessions.add(e.session_id);
    });

    return {
      date: day,
      uniqueVisitors: sessions.size,
      totalEvents: dayEvents.length,
      ...Object.fromEntries(EVENT_ACTIONS.map(a => [a, counts[a] || 0])),
    };
  });

  // Totals row
  const totals = dailyData.reduce(
    (acc, row) => {
      acc.uniqueVisitors += row.uniqueVisitors;
      acc.totalEvents += row.totalEvents;
      EVENT_ACTIONS.forEach(a => {
        acc[a] = (acc[a] || 0) + ((row as Record<string, number>)[a] || 0);
      });
      return acc;
    },
    { uniqueVisitors: 0, totalEvents: 0, ...Object.fromEntries(EVENT_ACTIONS.map(a => [a, 0])) } as Record<string, number>,
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <CardTitle className="text-base font-semibold">Daily Visitor Activity</CardTitle>
          <span className="text-xs text-muted-foreground ml-auto">Last 30 days</span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-background z-10 min-w-[100px]">Date</TableHead>
                <TableHead className="text-right min-w-[70px]">Visitors</TableHead>
                {EVENT_ACTIONS.map(action => (
                  <TableHead key={action} className="text-right min-w-[70px]">
                    {COLUMN_LABELS[action]}
                  </TableHead>
                ))}
                <TableHead className="text-right min-w-[70px]">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Totals row */}
              <TableRow className="bg-muted/50 font-semibold border-b-2">
                <TableCell className="sticky left-0 bg-muted/50 z-10 font-semibold">
                  30-Day Total
                </TableCell>
                <TableCell className="text-right font-semibold">{totals.uniqueVisitors}</TableCell>
                {EVENT_ACTIONS.map(action => (
                  <TableCell key={action} className="text-right font-semibold">
                    {totals[action]}
                  </TableCell>
                ))}
                <TableCell className="text-right font-semibold">{totals.totalEvents}</TableCell>
              </TableRow>

              {dailyData.map(row => {
                const hasActivity = row.totalEvents > 0;
                return (
                  <TableRow key={row.date.toISOString()} className={!hasActivity ? 'opacity-50' : ''}>
                    <TableCell className="sticky left-0 bg-background z-10 whitespace-nowrap">
                      {format(row.date, 'EEE, MMM d')}
                    </TableCell>
                    <TableCell className="text-right">{row.uniqueVisitors || '—'}</TableCell>
                    {EVENT_ACTIONS.map(action => (
                      <TableCell key={action} className="text-right">
                        {(row as Record<string, number>)[action] || '—'}
                      </TableCell>
                    ))}
                    <TableCell className="text-right">{row.totalEvents || '—'}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
