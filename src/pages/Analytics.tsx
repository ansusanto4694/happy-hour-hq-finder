import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConversionFunnelChart } from '@/components/analytics/ConversionFunnelChart';
import { TrafficOverviewChart } from '@/components/analytics/TrafficOverviewChart';
import { SessionMetricsCard } from '@/components/analytics/SessionMetricsCard';
import { TrafficSourcesChart } from '@/components/analytics/TrafficSourcesChart';
import { DeviceBreakdownChart } from '@/components/analytics/DeviceBreakdownChart';
import { SEOHead } from '@/components/SEOHead';
import { Calendar } from 'lucide-react';

export default function Analytics() {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('7d');

  const getDateRange = () => {
    const end = new Date().toISOString();
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    return { start, end };
  };

  const { start, end } = getDateRange();

  return (
    <>
      <SEOHead
        title="Analytics Dashboard - Conversion Funnel"
        description="Track user behavior and conversion rates through the customer journey"
      />
      
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Analytics Dashboard
            </h1>
            <p className="text-muted-foreground">
              Track user behavior, traffic patterns, and conversion opportunities
            </p>
          </div>

          {/* Date Range Selector */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Date Range
                  </CardTitle>
                  <CardDescription>
                    Select time period for analysis
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={dateRange === '7d' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDateRange('7d')}
                  >
                    Last 7 Days
                  </Button>
                  <Button
                    variant={dateRange === '30d' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDateRange('30d')}
                  >
                    Last 30 Days
                  </Button>
                  <Button
                    variant={dateRange === '90d' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDateRange('90d')}
                  >
                    Last 90 Days
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Analytics Tabs */}
          <Tabs defaultValue="traffic" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
              <TabsTrigger value="traffic">Traffic</TabsTrigger>
              <TabsTrigger value="behavior">Behavior</TabsTrigger>
              <TabsTrigger value="sources">Sources</TabsTrigger>
              <TabsTrigger value="devices">Devices</TabsTrigger>
              <TabsTrigger value="funnel">Funnel</TabsTrigger>
            </TabsList>

            <TabsContent value="traffic" className="space-y-6">
              <TrafficOverviewChart startDate={start} endDate={end} />
            </TabsContent>

            <TabsContent value="behavior" className="space-y-6">
              <SessionMetricsCard startDate={start} endDate={end} />
            </TabsContent>

            <TabsContent value="sources" className="space-y-6">
              <TrafficSourcesChart startDate={start} endDate={end} />
            </TabsContent>

            <TabsContent value="devices" className="space-y-6">
              <DeviceBreakdownChart startDate={start} endDate={end} />
            </TabsContent>

            <TabsContent value="funnel" className="space-y-6">
              <ConversionFunnelChart startDate={start} endDate={end} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
