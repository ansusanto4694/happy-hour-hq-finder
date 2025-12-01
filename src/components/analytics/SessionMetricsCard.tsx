import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSessionMetrics } from '@/hooks/useSessionMetrics';
import { Clock, TrendingDown, Target, FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface SessionMetricsCardProps {
  startDate?: string;
  endDate?: string;
}

export const SessionMetricsCard: React.FC<SessionMetricsCardProps> = ({
  startDate,
  endDate
}) => {
  const { data, isLoading } = useSessionMetrics({ startDate, endDate });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Session Metrics</CardTitle>
        <CardDescription>
          User engagement and behavior patterns
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Avg. Duration</span>
            </div>
            <div className="text-2xl font-bold">{formatDuration(data.avgSessionDuration)}</div>
            <p className="text-xs text-muted-foreground">
              Per session
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingDown className="w-4 h-4 text-red-600" />
              <span>Bounce Rate</span>
            </div>
            <div className="text-2xl font-bold">{data.bounceRate}%</div>
            <p className="text-xs text-muted-foreground">
              Single-page visits
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Target className="w-4 h-4 text-green-600" />
              <span>Engagement</span>
            </div>
            <div className="text-2xl font-bold">{data.engagementRate}%</div>
            <p className="text-xs text-muted-foreground">
              Engaged sessions
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="w-4 h-4 text-purple-600" />
              <span>Pages/Session</span>
            </div>
            <div className="text-2xl font-bold">{data.avgPageViews}</div>
            <p className="text-xs text-muted-foreground">
              Average views
            </p>
          </div>
        </div>

        {/* Insights */}
        <div className="mt-6 pt-6 border-t">
          <h4 className="text-sm font-semibold mb-3">Key Insights</h4>
          <ul className="space-y-2 text-sm">
            {data.bounceRate > 60 && (
              <li className="flex items-start gap-2">
                <span className="text-red-600 mt-0.5">⚠️</span>
                <span>
                  <strong>High bounce rate:</strong> {data.bounceRate}% of visitors leave after one page. 
                  Consider improving landing page engagement.
                </span>
              </li>
            )}
            {data.engagementRate > 50 && (
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✅</span>
                <span>
                  <strong>Good engagement:</strong> {data.engagementRate}% of sessions are engaged. 
                  Users are actively interacting with your content.
                </span>
              </li>
            )}
            {data.avgPageViews < 2 && (
              <li className="flex items-start gap-2">
                <span className="text-orange-600 mt-0.5">⚡</span>
                <span>
                  <strong>Low pages per session:</strong> Users view {data.avgPageViews} pages on average. 
                  Improve internal navigation to encourage exploration.
                </span>
              </li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
