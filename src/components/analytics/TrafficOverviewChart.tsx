import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTrafficOverview } from '@/hooks/useTrafficOverview';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Eye } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface TrafficOverviewChartProps {
  startDate?: string;
  endDate?: string;
}

export const TrafficOverviewChart: React.FC<TrafficOverviewChartProps> = ({
  startDate,
  endDate
}) => {
  const { data, isLoading } = useTrafficOverview({ startDate, endDate });

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
          <CardTitle>Traffic Overview</CardTitle>
          <CardDescription>No traffic data available for this period</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Calculate totals - properly deduplicate unique visitors across all days
  const allVisitorIds = new Set<string>();
  const totals = data.reduce(
    (acc, day) => {
      // Collect all unique visitor IDs across days to count actual unique visitors
      if (day.visitorIds) {
        day.visitorIds.forEach(id => allVisitorIds.add(id));
      }
      
      return {
        uniqueVisitors: allVisitorIds.size, // Count of truly unique visitors across entire period
        totalSessions: acc.totalSessions + day.totalSessions,
        pageViews: acc.pageViews + day.pageViews,
      };
    },
    { uniqueVisitors: 0, totalSessions: 0, pageViews: 0 }
  );

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              Unique Visitors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.uniqueVisitors.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              Total Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.totalSessions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {(totals.totalSessions / totals.uniqueVisitors).toFixed(1)} per visitor
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Eye className="w-4 h-4 text-purple-600" />
              Page Views
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.pageViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {(totals.pageViews / totals.totalSessions).toFixed(1)} per session
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Traffic Trends</CardTitle>
          <CardDescription>
            Daily unique visitors and page views over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="uniqueVisitors" 
                stroke="#2563eb" 
                strokeWidth={2}
                name="Unique Visitors"
              />
              <Line 
                type="monotone" 
                dataKey="pageViews" 
                stroke="#9333ea" 
                strokeWidth={2}
                name="Page Views"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
