import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const BackfillNeighborhoods: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState({ success: 0, failed: 0, skipped: 0 });

  const backfillNeighborhoods = async () => {
    setIsProcessing(true);
    setResults({ success: 0, failed: 0, skipped: 0 });

    try {
      console.log('Calling backfill-neighborhoods edge function...');
      
      const { data, error } = await supabase.functions.invoke('backfill-neighborhoods');

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      console.log('Backfill response:', data);

      if (data.success) {
        setResults({ 
          success: data.results.success, 
          failed: data.results.failed, 
          skipped: 0 
        });
        toast.success(data.message);
      } else {
        toast.error(data.error || 'Backfill failed');
      }
    } catch (error) {
      console.error('Backfill error:', error);
      toast.error('Failed to backfill neighborhoods');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-2">Backfill Neighborhood Data</h2>
      <p className="text-sm text-muted-foreground mb-4">
        This will process all merchants with coordinates but missing neighborhood data using reverse geocoding.
        The process runs server-side and can handle all merchants regardless of their active status.
      </p>

      {isProcessing && (
        <div className="mb-4 p-4 bg-accent/10 rounded">
          <p className="text-sm font-semibold">
            Processing neighborhoods... Please wait.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            This may take a few minutes depending on the number of merchants.
          </p>
        </div>
      )}

      {(results.success > 0 || results.failed > 0 || results.skipped > 0) && (
        <div className="mb-4 p-4 bg-accent/10 rounded">
          <p className="text-sm">
            ✅ Success: {results.success} | ⚠️ Failed: {results.failed} | ⏭️ Skipped: {results.skipped}
          </p>
        </div>
      )}

      <Button 
        onClick={backfillNeighborhoods}
        disabled={isProcessing}
      >
        {isProcessing ? 'Processing...' : 'Start Backfill'}
      </Button>
    </Card>
  );
};
