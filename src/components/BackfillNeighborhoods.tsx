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
      // Fetch all merchants with coordinates but no neighborhood
      const { data: merchants, error } = await supabase
        .from('Merchant')
        .select('id, latitude, longitude, street_address, city, state, zip_code, neighborhood')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (error) throw error;

      if (!merchants || merchants.length === 0) {
        toast.info('No merchants need neighborhood backfill');
        setIsProcessing(false);
        return;
      }

      setProgress({ current: 0, total: merchants.length });
      let successCount = 0;
      let failedCount = 0;
      let skippedCount = 0;

      for (let i = 0; i < merchants.length; i++) {
        const merchant = merchants[i];
        setProgress({ current: i + 1, total: merchants.length });

        // Skip if already has neighborhood
        if (merchant.neighborhood) {
          skippedCount++;
          continue;
        }

        const fullAddress = `${merchant.street_address}, ${merchant.city}, ${merchant.state} ${merchant.zip_code}`;

        try {
          // Call geocode-address with merchantId to auto-update
          const { data, error: geocodeError } = await supabase.functions.invoke('geocode-address', {
            body: { 
              address: fullAddress,
              merchantId: merchant.id 
            }
          });

          if (geocodeError || !data.success) {
            console.error(`Failed to geocode merchant ${merchant.id}:`, geocodeError);
            failedCount++;
          } else {
            successCount++;
            console.log(`Backfilled neighborhood for merchant ${merchant.id}: ${data.neighborhood || 'N/A'}`);
          }
        } catch (err) {
          console.error(`Error processing merchant ${merchant.id}:`, err);
          failedCount++;
        }

        // Rate limiting: wait 200ms between requests
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      setResults({ success: successCount, failed: failedCount, skipped: skippedCount });
      toast.success(`Backfill complete! Success: ${successCount}, Failed: ${failedCount}, Skipped: ${skippedCount}`);
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
        Re-geocode all merchants to extract and save neighborhood information from Mapbox.
        This will update existing merchants with their neighborhood data.
      </p>

      {isProcessing && (
        <div className="mb-4 p-4 bg-accent/10 rounded">
          <p className="text-sm font-semibold">
            Processing: {progress.current} / {progress.total} merchants
          </p>
          <div className="w-full bg-muted rounded-full h-2 mt-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {results.success > 0 && (
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
