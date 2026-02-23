import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Star, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export const GooglePlacesBackfill: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [totalProcessed, setTotalProcessed] = useState(0);
  const [totalSuccess, setTotalSuccess] = useState(0);
  const [totalFailed, setTotalFailed] = useState(0);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [batchNumber, setBatchNumber] = useState(0);
  const [lastResult, setLastResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const BATCH_SIZE = 20;

  const runBatch = useCallback(async (): Promise<boolean> => {
    const { data, error } = await supabase.functions.invoke(
      'fetch-google-places',
      { body: { mode: 'backfill', batchSize: BATCH_SIZE } }
    );

    if (error) throw error;

    const results = data?.results;
    if (!results) throw new Error('No results returned');

    setTotalProcessed(prev => prev + results.total);
    setTotalSuccess(prev => prev + results.success);
    setTotalFailed(prev => prev + results.failed);
    setRemaining(results.remaining);
    setBatchNumber(prev => prev + 1);

    return results.remaining > 0 && results.total > 0;
  }, []);

  const handleBackfill = async () => {
    setIsProcessing(true);
    setLastResult(null);
    setTotalProcessed(0);
    setTotalSuccess(0);
    setTotalFailed(0);
    setRemaining(null);
    setBatchNumber(0);

    try {
      let hasMore = true;
      while (hasMore) {
        hasMore = await runBatch();
      }

      setLastResult({
        success: true,
        message: 'Backfill complete!',
      });
    } catch (error) {
      console.error('Backfill error:', error);
      setLastResult({
        success: false,
        message: `Backfill stopped after batch ${batchNumber}. You can resume to continue.`,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const estimatedTotal = remaining !== null ? totalProcessed + remaining : null;
  const progressPercent = estimatedTotal && estimatedTotal > 0
    ? Math.round((totalProcessed / estimatedTotal) * 100)
    : 0;

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
          Fetch Google ratings for all merchants missing data.
          Processes in batches of {BATCH_SIZE} to avoid timeouts.
        </p>

        <Button
          onClick={handleBackfill}
          disabled={isProcessing}
          className="w-full"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing batch {batchNumber + 1}...
            </>
          ) : totalProcessed > 0 && remaining && remaining > 0 ? (
            'Resume Backfill'
          ) : (
            'Backfill Google Ratings'
          )}
        </Button>

        {isProcessing && (
          <div className="space-y-2">
            <Progress value={progressPercent} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Batch {batchNumber + 1}</span>
              <span>{totalProcessed} processed{remaining !== null ? ` / ~${totalProcessed + remaining} total` : ''}</span>
            </div>
          </div>
        )}

        {(totalProcessed > 0 || lastResult) && (
          <div
            className={`flex items-start gap-2 text-sm p-3 rounded-lg ${
              lastResult?.success !== false
                ? 'text-green-700 bg-green-50 border border-green-200'
                : 'text-red-700 bg-red-50 border border-red-200'
            }`}
          >
            {lastResult?.success !== false ? (
              <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <span>{lastResult?.message || 'Processing...'}</span>
              <div className="mt-1 text-xs">
                ✅ {totalSuccess} | ❌ {totalFailed} | Total: {totalProcessed}
                {remaining !== null && remaining > 0 && ` | Remaining: ~${remaining}`}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
