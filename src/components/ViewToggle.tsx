import React from 'react';
import { List, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAnalytics } from '@/hooks/useAnalytics';

interface ViewToggleProps {
  view: 'list' | 'map';
  onViewChange: (view: 'list' | 'map') => void;
}

export const ViewToggle: React.FC<ViewToggleProps> = ({ view, onViewChange }) => {
  const { track } = useAnalytics();

  const handleViewChange = async (newView: 'list' | 'map') => {
    await track({
      eventType: 'click',
      eventCategory: 'navigation',
      eventAction: 'view_toggle_clicked',
      eventLabel: newView === 'list' ? 'switch_to_list' : 'switch_to_map',
      pageUrl: window.location.href,
      pagePath: window.location.pathname
    });
    onViewChange(newView);
  };

  return (
    <div className="flex bg-gray-100 rounded-lg p-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleViewChange('list')}
        className={`flex-1 ${
          view === 'list' 
            ? 'bg-white shadow-sm text-gray-900 hover:bg-white hover:text-gray-900' 
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        }`}
      >
        <List className="w-4 h-4 mr-2" />
        List
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleViewChange('map')}
        className={`flex-1 ${
          view === 'map' 
            ? 'bg-white shadow-sm text-gray-900 hover:bg-white hover:text-gray-900' 
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        }`}
      >
        <Map className="w-4 h-4 mr-2" />
        Map
      </Button>
    </div>
  );
};