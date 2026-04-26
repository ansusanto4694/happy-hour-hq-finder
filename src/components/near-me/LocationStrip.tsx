import { MapPin, Loader2 } from 'lucide-react';
import type { NearMeLocation } from '@/hooks/useNearMeLocation';

interface LocationStripProps {
  location: NearMeLocation | null;
  isResolving: boolean;
  onEdit: () => void;
}

const sourceLabel: Record<NearMeLocation['source'], string> = {
  gps: 'Precise',
  manual: 'Chosen',
  ip: 'Approx.',
};

/**
 * Compact, tappable strip that shows the active location and opens the edit sheet.
 * Always rendered when a location exists; safe to render with location=null too.
 */
export function LocationStrip({ location, isResolving, onEdit }: LocationStripProps) {
  return (
    <button
      type="button"
      onClick={onEdit}
      className="inline-flex items-center gap-2 rounded-full bg-background/90 px-3 py-1.5 text-sm font-medium text-foreground shadow-sm hover:bg-background transition-colors min-h-[36px]"
      aria-label="Change location"
    >
      {isResolving ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : (
        <MapPin className="h-4 w-4 text-primary" />
      )}
      <span className="truncate max-w-[180px]">
        {location?.label ?? 'Set location'}
      </span>
      {location && (
        <span className="text-xs text-muted-foreground">
          · {sourceLabel[location.source]}
        </span>
      )}
      <span className="text-xs text-primary underline-offset-2 group-hover:underline">
        Change
      </span>
    </button>
  );
}
