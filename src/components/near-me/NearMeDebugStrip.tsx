import { useEffect, useState } from 'react';
import { useNearMeLocation } from '@/hooks/useNearMeLocation';
import { LocationStrip } from './LocationStrip';
import { LocationEditSheet } from './LocationEditSheet';
import { LocationPrompt } from './LocationPrompt';
import { Button } from '@/components/ui/button';

/**
 * Phase 2 debug surface — mounts above the mobile hero.
 * Shows the full state machine + a JSON readout so we can verify
 * GPS / manual / IP-fallback / persistence behavior end-to-end.
 *
 * To be removed/simplified in Phase 4 once the production UI is wired.
 */
export function NearMeDebugStrip() {
  const {
    location,
    status,
    error,
    isResolving,
    promptDismissed,
    requestGps,
    setManual,
    useIpFallback,
    clear,
    dismissPrompt,
  } = useNearMeLocation();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [ipFallbackTried, setIpFallbackTried] = useState(false);

  // If user dismissed the inline prompt and we still have no location,
  // silently try the IP fallback so the rest of the surface has *something* to work with.
  useEffect(() => {
    if (!location && promptDismissed && !ipFallbackTried && !isResolving) {
      setIpFallbackTried(true);
      void useIpFallback();
    }
  }, [location, promptDismissed, ipFallbackTried, isResolving, useIpFallback]);

  const showPrompt = !location && !promptDismissed;

  return (
    <div className="space-y-3 px-4 pt-3">
      <div className="flex flex-wrap items-center gap-2">
        <LocationStrip
          location={location}
          isResolving={isResolving}
          onEdit={() => setSheetOpen(true)}
        />
      </div>

      {showPrompt && (
        <LocationPrompt
          onAllow={() => {
            void requestGps();
          }}
          onChoose={() => setSheetOpen(true)}
          onDismiss={dismissPrompt}
          isResolving={isResolving}
        />
      )}

      {/* Debug readout — Phase 2 verification only */}
      <div className="rounded-md bg-background/95 p-3 text-xs font-mono text-foreground shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-semibold uppercase tracking-wide text-muted-foreground">
            Near-Me Debug
          </span>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs"
              onClick={() => void useIpFallback()}
              disabled={isResolving}
            >
              IP
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs"
              onClick={clear}
            >
              Clear
            </Button>
          </div>
        </div>
        <pre className="whitespace-pre-wrap break-words leading-snug">
{JSON.stringify(
  {
    status,
    error,
    isResolving,
    promptDismissed,
    location: location
      ? {
          lat: Number(location.lat.toFixed(5)),
          lng: Number(location.lng.toFixed(5)),
          label: location.label,
          source: location.source,
          accuracyMeters: location.accuracyMeters,
          ageSec: Math.round((Date.now() - location.resolvedAt) / 1000),
        }
      : null,
  },
  null,
  2,
)}
        </pre>
      </div>

      <LocationEditSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onUseGps={() => {
          void requestGps();
        }}
        onPickManual={setManual}
        isResolving={isResolving}
      />
    </div>
  );
}
