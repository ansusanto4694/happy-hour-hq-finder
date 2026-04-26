import { Link } from 'react-router-dom';
import { Clock, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

export type UrgencyTone = 'now' | 'soon' | 'later';

interface AFrameCardProps {
  merchantId: number;
  merchantName: string;
  slug: string | null;
  logoUrl: string | null;
  neighborhood: string | null;
  /** e.g. "0.4 mi" */
  distanceLabel: string;
  /** Headline content for the card body, e.g. "Happy Hour now · until 7pm" */
  primaryLine: string;
  /** Optional secondary line (event title, deal preview) */
  secondaryLine?: string;
  /** Urgency pill text, e.g. "Pouring now", "Starts in 25m", "Tonight 9pm" */
  urgencyLabel: string;
  urgencyTone: UrgencyTone;
  /** Optional event image to use instead of logo on top */
  imageUrl?: string | null;
}

const toneClasses: Record<UrgencyTone, string> = {
  now: 'bg-primary text-primary-foreground',
  soon: 'bg-accent text-accent-foreground',
  later: 'bg-muted text-muted-foreground',
};

export function AFrameCard({
  merchantId,
  merchantName,
  slug,
  logoUrl,
  neighborhood,
  distanceLabel,
  primaryLine,
  secondaryLine,
  urgencyLabel,
  urgencyTone,
  imageUrl,
}: AFrameCardProps) {
  const href = `/restaurant/${slug || merchantId}`;
  const topImage = imageUrl || logoUrl;

  return (
    <Link
      to={href}
      className={cn(
        'group flex w-[260px] shrink-0 flex-col overflow-hidden rounded-xl bg-card text-card-foreground',
        'border border-border/60 transition-colors hover:border-border',
      )}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {topImage ? (
          <img
            src={topImage}
            alt={merchantName}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <span className="text-xs">No image</span>
          </div>
        )}
        <span
          className={cn(
            'absolute left-2 top-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
            toneClasses[urgencyTone],
          )}
        >
          <Clock className="h-3 w-3" aria-hidden />
          {urgencyLabel}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-1 text-sm font-semibold">{merchantName}</h3>
        <p className="line-clamp-1 text-xs text-foreground/80">{primaryLine}</p>
        {secondaryLine && (
          <p className="line-clamp-1 text-xs text-muted-foreground">{secondaryLine}</p>
        )}
        <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
          <MapPin className="h-3 w-3" aria-hidden />
          <span className="line-clamp-1">
            {neighborhood ? `${neighborhood} · ` : ''}
            {distanceLabel}
          </span>
        </div>
      </div>
    </Link>
  );
}
