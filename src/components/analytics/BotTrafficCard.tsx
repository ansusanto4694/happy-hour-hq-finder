import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useBotTraffic } from '@/hooks/useBotTraffic';
import { Bot, Shield, Search, AlertTriangle, HelpCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface BotTrafficCardProps {
  startDate: string;
  endDate: string;
}

const botTypeConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  search_engine: { label: 'Search Engine', icon: <Search className="w-4 h-4" />, color: 'text-primary' },
  seo_tool: { label: 'SEO Tools', icon: <Search className="w-4 h-4" />, color: 'text-primary' },
  social_media: { label: 'Social Media', icon: <Bot className="w-4 h-4" />, color: 'text-accent-foreground' },
  monitoring: { label: 'Monitoring', icon: <Shield className="w-4 h-4" />, color: 'text-muted-foreground' },
  malicious: { label: 'Scrapers/Malicious', icon: <AlertTriangle className="w-4 h-4" />, color: 'text-destructive' },
  unknown: { label: 'Unknown', icon: <HelpCircle className="w-4 h-4" />, color: 'text-muted-foreground' },
};

export const BotTrafficCard = ({ startDate, endDate }: BotTrafficCardProps) => {
  const { data, isLoading } = useBotTraffic({ startDate, endDate });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent><Skeleton className="h-32 w-full" /></CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const sortedBreakdown = Object.entries(data.botBreakdown).sort(([, a], [, b]) => b - a);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bot className="w-5 h-5" />
          Bot Traffic Detected
        </CardTitle>
        <CardDescription>
          {data.botSessions} bot sessions ({data.botPercentage}% of total traffic)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold text-foreground">{data.totalSessions}</div>
            <div className="text-xs text-muted-foreground">Total Sessions</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold text-primary">{data.humanSessions}</div>
            <div className="text-xs text-muted-foreground">Human</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold text-destructive">{data.botSessions}</div>
            <div className="text-xs text-muted-foreground">Bot</div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">Bot Breakdown</h4>
          {sortedBreakdown.map(([type, count]) => {
            const config = botTypeConfig[type] || botTypeConfig.unknown;
            const pct = data.botSessions > 0 ? ((count / data.botSessions) * 100).toFixed(0) : '0';
            return (
              <div key={type} className="flex items-center justify-between text-sm">
                <div className={`flex items-center gap-2 ${config.color}`}>
                  {config.icon}
                  <span>{config.label}</span>
                </div>
                <span className="text-muted-foreground">{count} ({pct}%)</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
