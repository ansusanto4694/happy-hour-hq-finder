import { useEffect, useState } from 'react';
import { useNearMeLocation } from '@/hooks/useNearMeLocation';
import { LocationStrip } from './LocationStrip';
import { LocationEditSheet } from './LocationEditSheet';
import { LocationPrompt } from './LocationPrompt';

/**
 * Production hero for the mobile homepage.
 * Replaces the legacy gradient Hero. Surfaces the active location, an
 * inline prompt when none is set, and silently falls back to IP geolocation
 * if the user dismisses without choosing.
 */
export function NearMeNowHero() {
  const {
    location,
    isResolving,
    promptDismissed,
    requestGps,
    setManual,
    useIpFallback,
    dismissPrompt,
  } = useNearMeLocation();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [ipFallbackTried, setIpFallbackTried] = useState(false);

  useEffect(() => {
    if (!location && promptDismissed && !ipFallbackTried && !isResolving) {
      setIpFallbackTried(true);
      void useIpFallback();
    }
  }, [location, promptDismissed, ipFallbackTried, isResolving, useIpFallback]);

  const showPrompt = !location && !promptDismissed;

  return (
    <header className="px-4 pt-4 pb-3 space-y-3">
      <div>
        <h1 className="text-2xl font-bold text-foreground leading-tight">
          What's happening near you
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Live happy hours, events, and deals — right now.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <LocationStrip
          location={location}
          isResolving={isResolving}
          onEdit={() => setSheetOpen(true)}
        />
      </div>

      {showPrompt && (
        <LocationPrompt
          onAllow={() => void requestGps()}
          onChoose={() => setSheetOpen(true)}
          onDismiss={dismissPrompt}
          isResolving={isResolving}
        />
      )}

      <LocationEditSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onUseGps={() => void requestGps()}
        onPickManual={setManual}
        isResolving={isResolving}
      />
    </header>
  );
}
