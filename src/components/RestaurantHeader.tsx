
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface RestaurantHeaderProps {
  restaurantName?: string;
}

export const RestaurantHeader: React.FC<RestaurantHeaderProps> = ({ restaurantName }) => {
  const navigate = useNavigate();
  
  const handleBackToResults = () => {
    navigate('/results');
  };
  
  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="bg-white shadow-sm border-b">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={handleBackToResults}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Results</span>
          </Button>
          
          <div className="flex items-center space-x-3">
            {restaurantName && (
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500 text-xs">Logo</span>
                </div>
              </div>
            )}
            <h1 
              className="text-2xl font-bold text-gray-900 cursor-pointer hover:text-orange-500 transition-colors"
              onClick={handleGoHome}
            >
              {restaurantName || 'Happy.Hour'}
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
};
