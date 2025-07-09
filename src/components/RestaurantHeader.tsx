
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { AuthButton } from '@/components/AuthButton';

export const RestaurantHeader: React.FC = () => {
  const navigate = useNavigate();
  
  const handleBackToResults = () => {
    navigate(-1);
  };
  
  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="bg-white shadow-sm border-b">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={handleBackToResults}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Results</span>
            </Button>
            <h1 
              className="text-2xl font-bold text-gray-900 cursor-pointer hover:text-orange-500 transition-colors"
              onClick={handleGoHome}
            >
              Happy.Hour
            </h1>
          </div>
          <AuthButton />
        </div>
      </div>
    </div>
  );
};
