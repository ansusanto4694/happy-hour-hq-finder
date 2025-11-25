import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useConversionFunnel, useContactActionBreakdown } from '@/hooks/useConversionFunnel';
import { TrendingDown, Users, Target, Phone, Globe, MapPin } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface ConversionFunnelChartProps {
  startDate?: string;
  endDate?: string;
}

export const ConversionFunnelChart: React.FC<ConversionFunnelChartProps> = ({
  startDate,
  endDate
}) => {
  const { data: funnelData, isLoading: funnelLoading } = useConversionFunnel({ startDate, endDate });
  const { data: contactBreakdown, isLoading: contactLoading } = useContactActionBreakdown({ startDate, endDate });

  if (funnelLoading || contactLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!funnelData) return null;

  const maxWidth = 100;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              Total Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{funnelData.totalSessions.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="w-4 h-4 text-green-600" />
              Overall Conversion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{funnelData.overallConversionRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Homepage → Contact Action
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-600" />
              Biggest Drop-off
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const maxDropOff = Math.max(...funnelData.steps.map(s => s.dropOffRate));
              const stepWithMaxDropOff = funnelData.steps.find(s => s.dropOffRate === maxDropOff);
              return (
                <>
                  <div className="text-2xl font-bold">{maxDropOff.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stepWithMaxDropOff?.step}
                  </p>
                </>
              );
            })()}
          </CardContent>
        </Card>
      </div>

      {/* Funnel Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Conversion Funnel</CardTitle>
          <CardDescription>
            User journey from homepage to contact action
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {funnelData.steps.map((step, index) => {
              const widthPercent = funnelData.totalSessions > 0
                ? (step.uniqueSessions / funnelData.totalSessions) * maxWidth
                : 0;

              return (
                <div key={step.stepOrder} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{step.stepOrder}. {step.step}</span>
                      {index > 0 && step.dropOffRate > 20 && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                          High drop-off
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{step.uniqueSessions.toLocaleString()} sessions</span>
                      {index > 0 && (
                        <span className={step.conversionRate < 50 ? 'text-red-600' : 'text-green-600'}>
                          {step.conversionRate}% converted
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="relative h-10 bg-gray-100 rounded-lg overflow-hidden">
                    <div
                      className={`h-full flex items-center justify-center text-white font-semibold text-sm transition-all ${
                        index === 0 ? 'bg-blue-600' :
                        index === 1 ? 'bg-blue-500' :
                        index === 2 ? 'bg-purple-500' :
                        index === 3 ? 'bg-purple-600' :
                        index === 4 ? 'bg-orange-500' :
                        'bg-green-600'
                      }`}
                      style={{ width: `${widthPercent}%` }}
                    >
                      {step.uniqueSessions > 0 && (
                        <span>{step.uniqueSessions.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                  
                  {index < funnelData.steps.length - 1 && step.dropOffRate > 0 && (
                    <div className="text-xs text-red-600 pl-2">
                      ↓ {step.dropOffRate}% drop-off ({(funnelData.steps[index].uniqueSessions - funnelData.steps[index + 1].uniqueSessions).toLocaleString()} sessions lost)
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Contact Action Breakdown */}
      {contactBreakdown && (
        <Card>
          <CardHeader>
            <CardTitle>Contact Action Breakdown</CardTitle>
            <CardDescription>
              How users are choosing to contact restaurants
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-green-600" />
                    <span className="font-medium">Phone Calls</span>
                  </div>
                  <span className="text-2xl font-bold">{contactBreakdown.phone.count}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Mobile: {contactBreakdown.phone.mobile} | Desktop: {contactBreakdown.phone.desktop}
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-600"
                    style={{ 
                      width: `${contactBreakdown.phone.count / (contactBreakdown.phone.count + contactBreakdown.website.count + contactBreakdown.directions.count) * 100}%` 
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-600" />
                    <span className="font-medium">Website Visits</span>
                  </div>
                  <span className="text-2xl font-bold">{contactBreakdown.website.count}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Mobile: {contactBreakdown.website.mobile} | Desktop: {contactBreakdown.website.desktop}
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600"
                    style={{ 
                      width: `${contactBreakdown.website.count / (contactBreakdown.phone.count + contactBreakdown.website.count + contactBreakdown.directions.count) * 100}%` 
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-600" />
                    <span className="font-medium">Directions</span>
                  </div>
                  <span className="text-2xl font-bold">{contactBreakdown.directions.count}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Mobile: {contactBreakdown.directions.mobile} | Desktop: {contactBreakdown.directions.desktop}
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-600"
                    style={{ 
                      width: `${contactBreakdown.directions.count / (contactBreakdown.phone.count + contactBreakdown.website.count + contactBreakdown.directions.count) * 100}%` 
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights & Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Key Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {funnelData.steps.map((step, index) => {
              if (index === 0) return null;
              
              if (step.dropOffRate > 50) {
                return (
                  <li key={step.stepOrder} className="flex items-start gap-2">
                    <span className="text-red-600 mt-0.5">⚠️</span>
                    <span>
                      <strong>Critical drop-off at "{step.step}":</strong> {step.dropOffRate}% of users are leaving. 
                      Consider improving the user experience at this step.
                    </span>
                  </li>
                );
              }
              
              if (step.conversionRate < 30 && step.conversionRate > 0) {
                return (
                  <li key={step.stepOrder} className="flex items-start gap-2">
                    <span className="text-orange-600 mt-0.5">⚡</span>
                    <span>
                      <strong>Low conversion at "{step.step}":</strong> Only {step.conversionRate}% of users proceed. 
                      This step may need optimization.
                    </span>
                  </li>
                );
              }
              
              if (step.conversionRate > 70) {
                return (
                  <li key={step.stepOrder} className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✅</span>
                    <span>
                      <strong>Strong performance at "{step.step}":</strong> {step.conversionRate}% conversion rate. 
                      This step is working well.
                    </span>
                  </li>
                );
              }
              
              return null;
            }).filter(Boolean)}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
