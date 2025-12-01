import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTrafficSources } from '@/hooks/useTrafficSources';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Globe } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface TrafficSourcesChartProps {
  startDate?: string;
  endDate?: string;
}

const COLORS = ['#2563eb', '#16a34a', '#ea580c', '#9333ea', '#eab308', '#06b6d4'];

export const TrafficSourcesChart: React.FC<TrafficSourcesChartProps> = ({
  startDate,
  endDate
}) => {
  const { data, isLoading } = useTrafficSources({ startDate, endDate });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Traffic Sources</CardTitle>
          <CardDescription>No traffic source data available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Traffic Sources
        </CardTitle>
        <CardDescription>
          Where your visitors are coming from
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Chart */}
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ percentage }) => `${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="sessions"
                >
                  {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Breakdown */}
          <div className="space-y-3">
            {data.map((source, index) => (
              <div key={source.source} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="font-medium">{source.source}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{source.sessions.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">{source.percentage}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Insights */}
        <div className="mt-6 pt-6 border-t">
          <h4 className="text-sm font-semibold mb-3">Key Insights</h4>
          <ul className="space-y-2 text-sm">
            {data[0] && data[0].percentage > 70 && (
              <li className="flex items-start gap-2">
                <span className="text-orange-600 mt-0.5">⚡</span>
                <span>
                  <strong>Heavy reliance on {data[0].source}:</strong> {data[0].percentage}% of traffic. 
                  Consider diversifying traffic sources.
                </span>
              </li>
            )}
            {data.some(s => s.source === 'Organic' && s.percentage > 30) && (
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✅</span>
                <span>
                  <strong>Strong organic presence:</strong> Good SEO performance driving traffic.
                </span>
              </li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
