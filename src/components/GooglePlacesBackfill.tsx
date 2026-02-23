import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Star, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export const GooglePlacesBackfill: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<{
    success: boolean;
    message: string;
    results?: { success: number; failed: number; total: number };
  } | null>(null);

  const handleBackfill = async () => {
    setIsProcessing(true);
    setLastResult(null);

    try {
      const { data, error } = await supabase.functions.invoke(
        'fetch-google-places',
        { body: { mode: 'backfill' } }
      );

      if (error) throw error;
      setLastResult(data);
    } catch (error) {
      console.error('Backfill error:', error);
      setLastResult({
        success: false,
        message: 'Backfill failed. Please try again.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" />
          Google Places Ratings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Fetch Google ratings and review counts for all merchants missing data.
          This uses the Google Places API Text Search.
        </p>

        <Button
          onClick={handleBackfill}
          disabled={isProcessing}
          className="w-full"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Fetching Ratings...
            </>
          ) : (
            'Backfill Google Ratings'
          )}
        </Button>

        {lastResult && (
          <div
            className={`flex items-start gap-2 text-sm p-3 rounded-lg ${
              lastResult.success
                ? 'text-green-700 bg-green-50 border border-green-200'
                : 'text-red-700 bg-red-50 border border-red-200'
            }`}
          >
            {lastResult.success ? (
              <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <span>{lastResult.message}</span>
              {lastResult.results && (
                <div className="mt-1 text-xs">
                  ✅ {lastResult.results.success} | ❌{' '}
                  {lastResult.results.failed} | Total:{' '}
                  {lastResult.results.total}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
