import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useBotTraffic } from '@/hooks/useBotTraffic';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowDownRight, ArrowUpRight, GitCompare } from 'lucide-react';

interface AnalyticsComparisonCardProps {
  startDate: string;
  endDate: string;
  lovableVisitors: number;
  lovablePageviews: number;
  lovableBounceRate: number;
  lovableAvgDuration: number;
}

const formatDuration = (seconds: number) => {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
};

const DeltaBadge = ({ pct }: { pct: number }) => {
  if (pct === 0) return <span className="text-muted-foreground text-xs">—</span>;
  const isNeg = pct < 0;
  return (
    <span className={`inline-flex items-center text-xs font-medium ${isNeg ? 'text-destructive' : 'text-primary'}`}>
      {isNeg ? <ArrowDownRight className="w-3 h-3 mr-0.5" /> : <ArrowUpRight className="w-3 h-3 mr-0.5" />}
      {Math.abs(pct).toFixed(0)}%
    </span>
  );
};

export const AnalyticsComparisonCard = ({
  startDate,
  endDate,
  lovableVisitors,
  lovablePageviews,
  lovableBounceRate,
  lovableAvgDuration,
}: AnalyticsComparisonCardProps) => {
  const { data, isLoading } = useBotTraffic({ startDate, endDate });

  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
        <CardContent><Skeleton className="h-40 w-full" /></CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const delta = (lovable: number, custom: number) =>
    lovable === 0 ? 0 : ((lovable - custom) / lovable) * 100;

  const rows = [
    {
      metric: 'Visitors',
      lovable: lovableVisitors.toLocaleString(),
      custom: data.humanVisitors.toLocaleString(),
      pct: delta(lovableVisitors, data.humanVisitors),
    },
    {
      metric: 'Pageviews',
      lovable: lovablePageviews.toLocaleString(),
      custom: data.humanPageViews.toLocaleString(),
      pct: delta(lovablePageviews, data.humanPageViews),
    },
    {
      metric: 'Bounce Rate',
      lovable: `${lovableBounceRate}%`,
      custom: `${data.humanBounceRate}%`,
      pct: delta(lovableBounceRate, data.humanBounceRate),
    },
    {
      metric: 'Avg Duration',
      lovable: formatDuration(lovableAvgDuration),
      custom: formatDuration(data.humanAvgDuration),
      pct: delta(lovableAvgDuration, data.humanAvgDuration),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <GitCompare className="w-5 h-5" />
          Lovable vs Bot-Filtered Analytics
        </CardTitle>
        <CardDescription>
          Comparing Lovable's built-in analytics with custom bot-filtered Supabase data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Metric</TableHead>
              <TableHead className="text-right">Lovable</TableHead>
              <TableHead className="text-right">Custom (Filtered)</TableHead>
              <TableHead className="text-right">Δ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(row => (
              <TableRow key={row.metric}>
                <TableCell className="font-medium">{row.metric}</TableCell>
                <TableCell className="text-right">{row.lovable}</TableCell>
                <TableCell className="text-right">{row.custom}</TableCell>
                <TableCell className="text-right"><DeltaBadge pct={row.pct} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p className="text-xs text-muted-foreground mt-3">
          Δ shows how much Lovable's numbers exceed the bot-filtered count. Higher Δ = more bot inflation.
        </p>
      </CardContent>
    </Card>
  );
};
