import { useEffect, useMemo, useRef } from 'react';
import { useNearMeNow, type StartingSoonItem, type TonightItem, type PouringNowItem } from '@/hooks/useNearMeNow';
import { useNearMeLocation } from '@/hooks/useNearMeLocation';
import { useAnalytics } from '@/hooks/useAnalytics';
import { LiveFeedRow } from './LiveFeedRow';
import { AFrameCard } from './AFrameCard';
import type { DiscoveryCategory } from './DiscoveryChips';

function formatDistance(mi: number): string {
  if (mi < 0.1) return '<0.1 mi';
  return `${mi.toFixed(mi < 1 ? 2 : 1)} mi`;
}

function formatHourTime(t: string): string {
  const [hStr, mStr] = t.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const ampm = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${h12}${ampm}` : `${h12}:${String(m).padStart(2, '0')}${ampm}`;
}

function formatStartsIn(min: number): string {
  if (min <= 0) return 'Starting now';
  if (min < 60) return `Starts in ${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `Starts in ${h}h` : `Starts in ${h}h ${m}m`;
}

function formatEventTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/New_York',
  }).toLowerCase().replace(' ', '');
}

function eventMatchesCategory(eventType: string | null | undefined, tags: string[] | null | undefined, cat: DiscoveryCategory): boolean {
  if (cat === 'all') return true;
  const haystack = [
    (eventType || '').toLowerCase(),
    ...((tags || []).map((t) => t.toLowerCase())),
  ].join(' ');
  if (cat === 'happy_hour') return false; // events row hidden when filter is happy_hour-only
  return haystack.includes(cat.replace('_', ' ')) || haystack.includes(cat) || haystack.includes(cat.replace('_', '-'));
}

interface NearMeFeedProps {
  alwaysMount?: boolean;
  category?: DiscoveryCategory;
}

export function NearMeFeed({ alwaysMount = false, category = 'all' }: NearMeFeedProps) {
  const { location } = useNearMeLocation();
  const { track } = useAnalytics();
  const lat = location?.lat;
  const lng = location?.lng;

  const { data, isLoading, isError } = useNearMeNow({
    lat,
    lng,
    enabled: typeof lat === 'number' && typeof lng === 'number',
  });

  const hint = useMemo(() => {
    if (!data) return undefined;
    return `Showing within ${data.radius_used.now_soon} mi${data.expanded ? ' (expanded)' : ''}`;
  }, [data]);

  const tonightHint = useMemo(() => {
    if (!data) return undefined;
    return `Showing within ${data.radius_used.tonight} mi`;
  }, [data]);

  // Analytics: feed viewed (once per fresh data load + location)
  const viewedKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (!data || !location) return;
    const key = `${location.lat.toFixed(3)}|${location.lng.toFixed(3)}|${category}`;
    if (viewedKeyRef.current === key) return;
    viewedKeyRef.current = key;
    track({
      eventType: 'impression',
      eventCategory: 'carousel',
      eventAction: 'near_me_feed_viewed',
      eventLabel: category,
      metadata: {
        pouring_count: data.pouring_now.length,
        starting_count: data.starting_soon.length,
        tonight_count: data.tonight.length,
        radius_now: data.radius_used.now_soon,
        radius_tonight: data.radius_used.tonight,
        location_source: location.source,
        category,
      },
    });
  }, [data, location, category, track]);

  if (!location && !alwaysMount) return null;

  if (!location) {
    return (
      <div className="px-4 py-6 text-center text-xs text-muted-foreground">
        Set a location to see what's happening near you.
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-4 rounded-lg border border-dashed border-destructive/40 px-3 py-6 text-center text-xs text-destructive">
        Couldn't load nearby happenings. Try again in a moment.
      </div>
    );
  }

  const allPouring = data?.pouring_now ?? [];
  const allStarting = data?.starting_soon ?? [];
  const allTonight = data?.tonight ?? [];

  // Apply category filter
  const showHappyHour = category === 'all' || category === 'happy_hour';
  const pouring = showHappyHour ? allPouring : [];
  const starting = category === 'all' || category === 'happy_hour'
    ? allStarting.filter(() => category === 'all') // hide events when happy_hour-only
    : allStarting.filter((i) => eventMatchesCategory(i.event.event_type, i.event.category_tags, category));
  const tonight = category === 'all' || category === 'happy_hour'
    ? allTonight.filter(() => category === 'all')
    : allTonight.filter((i) => eventMatchesCategory(i.event.event_type, i.event.category_tags, category));

  const handleCardClick = (row: string, merchantId: number, eventId?: number) => {
    track({
      eventType: 'click',
      eventCategory: 'carousel',
      eventAction: 'near_me_card_clicked',
      eventLabel: row,
      merchantId,
      metadata: { row, event_id: eventId, category },
    });
  };

  return (
    <div className="space-y-5 py-2">
      {showHappyHour && (
        <LiveFeedRow
          title="Pouring now"
          hint={hint}
          isLoading={isLoading}
          isEmpty={!isLoading && pouring.length === 0}
          emptyMessage="No happy hours running right now."
        >
          {pouring.map((item: PouringNowItem) => (
            <AFrameCard
              key={`pouring-${item.merchant.id}`}
              merchantId={item.merchant.id}
              merchantName={item.merchant.restaurant_name}
              slug={item.merchant.slug}
              logoUrl={item.merchant.logo_url}
              neighborhood={item.merchant.neighborhood}
              distanceLabel={formatDistance(item.distance_mi)}
              primaryLine={`Happy hour until ${formatHourTime(item.happy_hour_end)}`}
              urgencyLabel="Pouring now"
              urgencyTone="now"
              onClick={() => handleCardClick('pouring_now', item.merchant.id)}
            />
          ))}
        </LiveFeedRow>
      )}

      <LiveFeedRow
        title="Starting soon"
        hint={hint}
        isLoading={isLoading}
        isEmpty={!isLoading && starting.length === 0}
        emptyMessage="Nothing kicking off in the next 2 hours."
      >
        {starting.map((item: StartingSoonItem) => (
          <AFrameCard
            key={`soon-${item.event.id}`}
            merchantId={item.merchant.id}
            merchantName={item.merchant.restaurant_name}
            slug={item.merchant.slug}
            logoUrl={item.merchant.logo_url}
            imageUrl={item.event.image_url}
            neighborhood={item.merchant.neighborhood}
            distanceLabel={formatDistance(item.distance_mi)}
            primaryLine={item.event.title}
            secondaryLine={`At ${formatEventTime(item.event.event_date)}`}
            urgencyLabel={formatStartsIn(item.starts_in_min)}
            urgencyTone="soon"
            onClick={() => handleCardClick('starting_soon', item.merchant.id, item.event.id)}
          />
        ))}
      </LiveFeedRow>

      <LiveFeedRow
        title="Tonight"
        hint={tonightHint}
        isLoading={isLoading}
        isEmpty={!isLoading && tonight.length === 0}
        emptyMessage="No more events tonight in this area."
      >
        {tonight.map((item: TonightItem) => (
          <AFrameCard
            key={`tonight-${item.event.id}`}
            merchantId={item.merchant.id}
            merchantName={item.merchant.restaurant_name}
            slug={item.merchant.slug}
            logoUrl={item.merchant.logo_url}
            imageUrl={item.event.image_url}
            neighborhood={item.merchant.neighborhood}
            distanceLabel={formatDistance(item.distance_mi)}
            primaryLine={item.event.title}
            secondaryLine={`Tonight at ${formatEventTime(item.event.event_date)}`}
            urgencyLabel={`Tonight ${formatEventTime(item.event.event_date)}`}
            urgencyTone="later"
            onClick={() => handleCardClick('tonight', item.merchant.id, item.event.id)}
          />
        ))}
      </LiveFeedRow>
    </div>
  );
}
