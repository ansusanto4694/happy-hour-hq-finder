
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const GeocodingDebugger = () => {
  const [isTestingTrigger, setIsTestingTrigger] = useState(false);
  const [isTestingEdgeFunction, setIsTestingEdgeFunction] = useState(false);
  const [isCheckingMerchant, setIsCheckingMerchant] = useState(false);

  const checkMerchantData = async () => {
    setIsCheckingMerchant(true);
    try {
      const { data, error } = await supabase
        .from('Merchant')
        .select('*')
        .eq('id', 34)
        .single();

      if (error) {
        toast.error(`Error fetching merchant: ${error.message}`);
        console.error('Merchant fetch error:', error);
      } else {
        console.log('Merchant 34 data:', data);
        toast.success(`Merchant 34 found: ${data.restaurant_name}`);
        console.log('Full address:', `${data.street_address}, ${data.city}, ${data.state} ${data.zip_code}`);
        console.log('Current coordinates:', { lat: data.latitude, lng: data.longitude, geocoded_at: data.geocoded_at });
      }
    } catch (error) {
      toast.error(`Error: ${error}`);
      console.error('Error:', error);
    }
    setIsCheckingMerchant(false);
  };

  const testDatabaseTrigger = async () => {
    setIsTestingTrigger(true);
    try {
      // Try to update merchant 34 to trigger the geocoding
      const { error } = await supabase
        .from('Merchant')
        .update({ 
          street_address: '456 Updated Test Street', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', 34);

      if (error) {
        toast.error(`Database update failed: ${error.message}`);
        console.error('Database update error:', error);
      } else {
        toast.success('Database updated successfully. Check logs for trigger activity.');
        console.log('Successfully updated merchant 34 address');
        
        // Check the result after a short delay
        setTimeout(async () => {
          const { data } = await supabase
            .from('Merchant')
            .select('latitude, longitude, geocoded_at')
            .eq('id', 34)
            .single();
          
          console.log('Coordinates after update:', data);
        }, 3000);
      }
    } catch (error) {
      toast.error(`Error: ${error}`);
      console.error('Error:', error);
    }
    setIsTestingTrigger(false);
  };

  const testEdgeFunctionDirectly = async () => {
    setIsTestingEdgeFunction(true);
    try {
      const { data, error } = await supabase.functions.invoke('geocode-address', {
        body: {
          merchant_id: 34,
          address: '456 Updated Test Street, Test City, CA 90210'
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

  const testManualGeocode = async () => {
    try {
      const { error } = await supabase.rpc('manual_geocode_merchant', {
        merchant_id: 34
      });

      if (error) {
        toast.error(`Manual geocode error: ${error.message}`);
        console.error('Manual geocode error:', error);
      } else {
        toast.success('Manual geocoding triggered successfully!');
        console.log('Manual geocoding completed for merchant 34');
      }
    } catch (error) {
      toast.error(`Error: ${error}`);
      console.error('Error:', error);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Geocoding Debug Tools - Testing Merchant ID 34</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="font-semibold">Check Merchant Data</h3>
          <p className="text-sm text-gray-600">
            Check current data for merchant ID 34.
          </p>
          <Button 
            onClick={checkMerchantData} 
            disabled={isCheckingMerchant}
            variant="outline"
          >
            {isCheckingMerchant ? 'Checking...' : 'Check Merchant 34'}
          </Button>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold">Test Database Trigger</h3>
          <p className="text-sm text-gray-600">
            This will update merchant ID 34 to see if the database trigger fires.
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

        <div className="space-y-2">
          <h3 className="font-semibold">Test Manual Geocode Function</h3>
          <p className="text-sm text-gray-600">
            This will call the manual_geocode_merchant database function.
          </p>
          <Button 
            onClick={testManualGeocode} 
            variant="outline"
          >
            Test Manual Geocode
          </Button>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <h4 className="font-semibold text-yellow-800">Debug Steps:</h4>
          <ol className="list-decimal list-inside text-sm text-yellow-700 mt-2 space-y-1">
            <li>First, check merchant 34 data to see current state</li>
            <li>Test the database trigger by updating the address</li>
            <li>Test the Edge Function directly to verify it works</li>
            <li>Test the manual geocode function</li>
            <li>Check the logs after each test for detailed information</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default GeocodingDebugger;
