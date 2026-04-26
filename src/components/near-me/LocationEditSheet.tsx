import { useEffect, useState } from 'react';
import { Loader2, MapPin, Navigation } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocationSuggestions, type LocationSuggestion } from '@/hooks/useLocationSuggestions';

interface LocationEditSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUseGps: () => void;
  onPickManual: (input: { lat: number; lng: number; label: string }) => void;
  isResolving?: boolean;
}

/**
 * Bottom sheet for changing the active location.
 * Two paths: tap "Use my location" → GPS, or type a neighborhood/zip → manual.
 */
export function LocationEditSheet({
  open,
  onOpenChange,
  onUseGps,
  onPickManual,
  isResolving,
}: LocationEditSheetProps) {
  const [query, setQuery] = useState('');
  const {
    suggestions,
    isLoading,
    showSuggestions,
    fetchSuggestions,
    clearSuggestions,
  } = useLocationSuggestions({
    onSelect: (s: LocationSuggestion) => {
      onPickManual({
        lat: s.center[1],
        lng: s.center[0],
        label: s.text || s.place_name,
      });
      setQuery('');
      clearSuggestions();
      onOpenChange(false);
    },
  });

  useEffect(() => {
    if (!open) {
      setQuery('');
      clearSuggestions();
    }
  }, [open, clearSuggestions]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto pb-24">
        <SheetHeader className="text-left">
          <SheetTitle>Change location</SheetTitle>
          <SheetDescription>
            Use your current location or pick a neighborhood.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          <Button
            type="button"
            size="mobile-lg"
            className="w-full justify-start"
            onClick={() => {
              onUseGps();
              onOpenChange(false);
            }}
            disabled={isResolving}
          >
            <Navigation className="h-4 w-4" />
            Use my current location
          </Button>

          <div className="relative">
            <label
              htmlFor="near-me-location-search"
              className="mb-1 block text-sm font-medium text-foreground"
            >
              Or search a neighborhood, city, or zip
            </label>
            <Input
              id="near-me-location-search"
              type="text"
              inputMode="search"
              autoComplete="off"
              placeholder="e.g. West Village, 10014"
              value={query}
              onChange={(e) => {
                const v = e.target.value;
                setQuery(v);
                fetchSuggestions(v);
              }}
              className="text-base"
            />

            {showSuggestions && (
              <div className="mt-2 rounded-md border border-border bg-popover">
                {isLoading && (
                  <div className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Searching…
                  </div>
                )}
                {!isLoading && suggestions.length === 0 && query.length >= 2 && (
                  <div className="px-3 py-3 text-sm text-muted-foreground">
                    No matches found.
                  </div>
                )}
                {!isLoading &&
                  suggestions.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        onPickManual({
                          lat: s.center[1],
                          lng: s.center[0],
                          label: s.text || s.place_name,
                        });
                        setQuery('');
                        clearSuggestions();
                        onOpenChange(false);
                      }}
                      className="flex w-full items-start gap-2 px-3 py-3 text-left text-sm hover:bg-muted min-h-[44px]"
                    >
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="flex-1">
                        <span className="block font-medium text-foreground">
                          {s.text}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {s.place_name}
                        </span>
                      </span>
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
