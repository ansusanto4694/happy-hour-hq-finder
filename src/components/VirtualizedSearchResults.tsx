import React, { useMemo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { SearchResultCard } from './SearchResultCard';
import { useSearchResultsNavigation } from '@/hooks/useSearchResultsNavigation';

interface VirtualizedSearchResultsProps {
  merchants: any[];
  isMobile?: boolean;
  itemHeight?: number;
  height?: number;
}

const VirtualizedSearchResults: React.FC<VirtualizedSearchResultsProps> = ({
  merchants,
  isMobile = false,
  itemHeight = isMobile ? 120 : 180,
  height = 600
}) => {
  const { handleRestaurantClick } = useSearchResultsNavigation();

  // Memoized item renderer for virtual list
  const ItemRenderer = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const restaurant = merchants[index];
    
    return (
      <div style={style}>
        <div className="px-1 pb-3">
          <SearchResultCard
            restaurant={restaurant}
            onClick={handleRestaurantClick}
            isMobile={isMobile}
          />
        </div>
      </div>
    );
  }, [merchants, handleRestaurantClick, isMobile]);

  // Only enable virtualization for large lists
  const shouldVirtualize = merchants.length > 50;

  if (!shouldVirtualize) {
    return (
      <div className="space-y-3">
        {merchants.map((restaurant) => (
          <SearchResultCard
            key={restaurant.id}
            restaurant={restaurant}
            onClick={handleRestaurantClick}
            isMobile={isMobile}
          />
        ))}
      </div>
    );
  }

  return (
    <List
      height={height}
      width="100%"
      itemCount={merchants.length}
      itemSize={itemHeight}
      itemData={merchants}
      className="virtualized-list"
    >
      {ItemRenderer}
    </List>
  );
};

export default React.memo(VirtualizedSearchResults);