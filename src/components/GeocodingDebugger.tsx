
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const GeocodingDebugger = () => {
  const [isTestingTrigger, setIsTestingTrigger] = useState(false);
  const [isTestingEdgeFunction, setIsTestingEdgeFunction] = useState(false);

  const testDatabaseTrigger = async () => {
    setIsTestingTrigger(true);
    try {
      // Try to update merchant 33 to trigger the geocoding
      const { error } = await supabase
        .from('Merchant')
        .update({ 
          street_address: '123 Test Street Updated', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', 33);

      if (error) {
        toast.error(`Database update failed: ${error.message}`);
      } else {
        toast.success('Database updated successfully. Check logs for trigger activity.');
      }
    } catch (error) {
      toast.error(`Error: ${error}`);
    }
    setIsTestingTrigger(false);
  };

  const testEdgeFunctionDirectly = async () => {
    setIsTestingEdgeFunction(true);
    try {
      const { data, error } = await supabase.functions.invoke('geocode-address', {
        body: {
          merchant_id: 33,
          address: '123 Test Street, Test City, CA 90210'
        }
      });

      if (error) {
        toast.error(`Edge Function error: ${error.message}`);
        console.error('Edge Function error:', error);
      } else {
        toast.success('Edge Function called successfully!');
        console.log('Edge Function response:', data);
      }
    } catch (error) {
      toast.error(`Error calling Edge Function: ${error}`);
      console.error('Error:', error);
    }
    setIsTestingEdgeFunction(false);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Geocoding Debug Tools</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="font-semibold">Test Database Trigger</h3>
          <p className="text-sm text-gray-600">
            This will update merchant ID 33 to see if the database trigger fires.
          </p>
          <Button 
            onClick={testDatabaseTrigger} 
            disabled={isTestingTrigger}
            variant="outline"
          >
            {isTestingTrigger ? 'Testing...' : 'Test Database Trigger'}
          </Button>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold">Test Edge Function Directly</h3>
          <p className="text-sm text-gray-600">
            This will call the geocode-address Edge Function directly.
          </p>
          <Button 
            onClick={testEdgeFunctionDirectly} 
            disabled={isTestingEdgeFunction}
            variant="outline"
          >
            {isTestingEdgeFunction ? 'Testing...' : 'Test Edge Function'}
          </Button>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <h4 className="font-semibold text-yellow-800">Instructions:</h4>
          <ol className="list-decimal list-inside text-sm text-yellow-700 mt-2 space-y-1">
            <li>First, test the Edge Function directly to verify it works</li>
            <li>Then test the database trigger to see if it calls the function</li>
            <li>Check the Edge Function logs after each test</li>
            <li>Also check the PostgreSQL logs for any trigger-related messages</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default GeocodingDebugger;
