import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MobilePageHeaderProps {
  title: string;
  showBackButton?: boolean;
  showHomeButton?: boolean;
}

export const MobilePageHeader: React.FC<MobilePageHeaderProps> = ({ 
  title, 
  showBackButton = true,
  showHomeButton = true 
}) => {
  const navigate = useNavigate();

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border shadow-sm">
      <div className="flex items-center justify-between h-14 px-4">
        {showBackButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        
        <h1 className="flex-1 text-lg font-semibold text-center truncate px-2">
          {title}
        </h1>
        
        {showHomeButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="p-2"
          >
            <Home className="w-5 h-5" />
          </Button>
        )}
      </div>
    </div>
  );
};
