
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Sample data for demonstration
const sampleResults = [
  {
    id: 1,
    name: "The Golden Tap",
    logo: "/placeholder.svg",
    address: "123 Main St, Downtown",
    phone: "(555) 123-4567",
    happyHour: "4:00 PM - 7:00 PM"
  },
  {
    id: 2,
    name: "Sunset Grill",
    logo: "/placeholder.svg",
    address: "456 Oak Avenue, Midtown",
    phone: "(555) 987-6543",
    happyHour: "3:00 PM - 6:00 PM"
  },
  {
    id: 3,
    name: "Harbor View Bar",
    logo: "/placeholder.svg",
    address: "789 Waterfront Dr, Harbor District",
    phone: "(555) 456-7890",
    happyHour: "5:00 PM - 8:00 PM"
  }
];

export const SearchResults = () => {
  const navigate = useNavigate();

  const handleRestaurantClick = (restaurantId: number) => {
    navigate(`/restaurant/${restaurantId}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">
          Happy Hour Results
        </h2>
        <p className="text-gray-500">
          {sampleResults.length} results found
        </p>
      </div>
      
      <div className="space-y-3">
        {sampleResults.map((result) => (
          <Card 
            key={result.id} 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleRestaurantClick(result.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start space-x-4">
                {/* Logo */}
                <div className="flex-shrink-0">
                  <img 
                    src={result.logo} 
                    alt={`${result.name} logo`}
                    className="w-16 h-16 rounded-lg object-cover bg-gray-200"
                  />
                </div>
                
                {/* Restaurant details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {result.name}
                      </h3>
                      <p className="text-gray-600 text-sm mt-1">
                        {result.address}
                      </p>
                      <p className="text-gray-600 text-sm">
                        {result.phone}
                      </p>
                    </div>
                    
                    <Badge variant="secondary" className="ml-2 flex-shrink-0">
                      {result.happyHour}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
