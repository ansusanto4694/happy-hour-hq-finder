import { MapPin, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LocationPromptProps {
  onAllow: () => void;
  onChoose: () => void;
  onDismiss: () => void;
  isResolving?: boolean;
}

/**
 * Inline prompt shown when we have no location yet AND the user hasn't dismissed.
 * Two paths forward — share GPS, or pick manually. IP fallback runs silently
 * elsewhere if the user dismisses without choosing.
 */
export function LocationPrompt({
  onAllow,
  onChoose,
  onDismiss,
  isResolving,
}: LocationPromptProps) {
  return (
    <div className="relative rounded-2xl bg-background p-4 shadow-sm">
      <button
        type="button"
        onClick={onDismiss}
        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-primary/10 p-2">
          <MapPin className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-foreground">
            Find what's near you
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Share your location or pick a neighborhood to see what's open right now.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              size="mobile-sm"
              onClick={onAllow}
              disabled={isResolving}
            >
              Use my location
            </Button>
            <Button
              size="mobile-sm"
              variant="outline"
              onClick={onChoose}
              disabled={isResolving}
            >
              Choose neighborhood
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
