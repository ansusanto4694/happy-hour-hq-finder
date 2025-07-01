
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const ResultsMap = () => {
  return (
    <Card className="h-full lg:sticky lg:top-6">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Map View</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="bg-gray-200 rounded-lg h-[600px] lg:h-[calc(100vh-200px)] flex items-center justify-center">
          <p className="text-gray-500">Map will be integrated here</p>
        </div>
      </CardContent>
    </Card>
  );
};
