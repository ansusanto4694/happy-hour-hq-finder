import React from 'react';
import { List, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ViewToggleProps {
  view: 'list' | 'map';
  onViewChange: (view: 'list' | 'map') => void;
}

export const ViewToggle: React.FC<ViewToggleProps> = ({ view, onViewChange }) => {
  return (
    <div className="flex bg-gray-100 rounded-lg p-1">
      <Button
        variant={view === 'list' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('list')}
        className={`flex-1 ${view === 'list' ? 'bg-white shadow-sm' : ''}`}
      >
        <List className="w-4 h-4 mr-2" />
        List
      </Button>
      <Button
        variant={view === 'map' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('map')}
        className={`flex-1 ${view === 'map' ? 'bg-white shadow-sm' : ''}`}
      >
        <Map className="w-4 h-4 mr-2" />
        Map
      </Button>
    </div>
  );
};