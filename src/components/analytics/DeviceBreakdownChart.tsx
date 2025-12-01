import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useDeviceBreakdown } from '@/hooks/useDeviceBreakdown';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Smartphone, Tablet, Monitor } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface DeviceBreakdownChartProps {
  startDate?: string;
  endDate?: string;
}

export const DeviceBreakdownChart: React.FC<DeviceBreakdownChartProps> = ({
  startDate,
  endDate
}) => {
  const { data, isLoading } = useDeviceBreakdown({ startDate, endDate });

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
          <CardTitle>Device Breakdown</CardTitle>
          <CardDescription>No device data available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const getDeviceIcon = (device: string) => {
    switch (device.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="w-4 h-4 text-blue-600" />;
      case 'tablet':
        return <Tablet className="w-4 h-4 text-green-600" />;
      case 'desktop':
        return <Monitor className="w-4 h-4 text-purple-600" />;
      default:
        return <Monitor className="w-4 h-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Device Breakdown</CardTitle>
        <CardDescription>
          User sessions and behavior by device type
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Device Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.map((device) => (
              <div key={device.device} className="space-y-2 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getDeviceIcon(device.device)}
                    <span className="font-medium">{device.device}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{device.percentage}%</span>
                </div>
                <div className="text-2xl font-bold">{device.sessions.toLocaleString()}</div>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mt-2">
                  <div>
                    <div className="font-medium">Avg. Duration</div>
                    <div>{Math.floor(device.avgSessionDuration / 60)}m {device.avgSessionDuration % 60}s</div>
                  </div>
                  <div>
                    <div className="font-medium">Bounce Rate</div>
                    <div>{device.bounceRate}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="mt-6">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="device" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="sessions" fill="#2563eb" name="Sessions" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Insights */}
          <div className="pt-6 border-t">
            <h4 className="text-sm font-semibold mb-3">Key Insights</h4>
            <ul className="space-y-2 text-sm">
              {data.find(d => d.device === 'Mobile' && d.percentage > 60) && (
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">📱</span>
                  <span>
                    <strong>Mobile-first audience:</strong> Majority of traffic from mobile devices. 
                    Ensure mobile experience is optimized.
                  </span>
                </li>
              )}
              {data.find(d => d.bounceRate > 70) && (
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-0.5">⚠️</span>
                  <span>
                    <strong>High {data.find(d => d.bounceRate > 70)?.device} bounce rate:</strong> 
                    Consider improving user experience on this device type.
                  </span>
                </li>
              )}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
