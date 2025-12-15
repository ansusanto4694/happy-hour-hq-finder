import React, { useState } from 'react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConversionFunnelChart } from '@/components/analytics/ConversionFunnelChart';
import { TrafficOverviewChart } from '@/components/analytics/TrafficOverviewChart';
import { SessionMetricsCard } from '@/components/analytics/SessionMetricsCard';
import { TrafficSourcesChart } from '@/components/analytics/TrafficSourcesChart';
import { DeviceBreakdownChart } from '@/components/analytics/DeviceBreakdownChart';
import { SEOHead } from '@/components/SEOHead';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function Analytics() {
  const [startDate, setStartDate] = useState<Date>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date;
  });
  const [endDate, setEndDate] = useState<Date>(new Date());

  const start = startDate.toISOString();
  const end = endDate.toISOString();

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
                    <CalendarIcon className="w-5 h-5" />
                    Date Range
                  </CardTitle>
                  <CardDescription>
                    Select time period for analysis
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-[160px] justify-start text-left font-normal",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "MMM d, yyyy") : <span>Start date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => date && setStartDate(date)}
                        disabled={(date) => date > endDate || date > new Date()}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  <span className="text-muted-foreground">to</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-[160px] justify-start text-left font-normal",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "MMM d, yyyy") : <span>End date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={(date) => date && setEndDate(date)}
                        disabled={(date) => date < startDate || date > new Date()}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
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
