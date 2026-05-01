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
  /** Headline content for the card body */
  primaryLine: string;
  /** Optional secondary line (event title, deal preview) */
  secondaryLine?: string;
  /** Urgency pill text */
  urgencyLabel: string;
  urgencyTone: UrgencyTone;
  /** Optional event image (currently unused in compact layout, reserved for future) */
  imageUrl?: string | null;
  /** Optional click handler (fires alongside navigation, e.g. for analytics) */
  onClick?: () => void;
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
  onClick,
}: AFrameCardProps) {
  const href = `/restaurant/${slug || merchantId}`;

  return (
    <Link
      to={href}
      onClick={onClick}
      className="flex-shrink-0 w-52 bg-card border rounded-xl p-3 cursor-pointer mr-2 active:scale-[0.98] transition-all contain-layout block"
      style={{ scrollSnapAlign: 'start' }}
      draggable={false}
    >
      {/* Logo - compact centered (mirrors MobileCarouselCard) */}
      <div className="flex justify-center mb-2">
        <div
          className={cn(
            'w-20 h-20 border border-border rounded-lg flex items-center justify-center overflow-hidden',
            logoUrl ? 'bg-white' : 'bg-gradient-to-br from-orange-100 to-amber-100',
          )}
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={`${merchantName} logo`}
              className="w-full h-full object-contain p-1.5"
              width={80}
              height={80}
              loading="lazy"
              decoding="async"
              fetchPriority="low"
            />
          ) : (
            <span className="text-muted-foreground font-bold text-2xl">
              {(merchantName || '?').charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* Merchant name */}
      <h4 className="font-bold text-base text-foreground line-clamp-1 mb-1 text-center">
        {merchantName}
      </h4>

      {/* Neighborhood + distance */}
      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-2">
        <MapPin className="w-3 h-3" aria-hidden />
        <span className="truncate">
          {neighborhood ? `${neighborhood} · ` : ''}
          {distanceLabel}
        </span>
      </div>

      {/* Urgency pill */}
      <div className="flex justify-center mb-1.5">
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-tight shadow-sm',
            toneClasses[urgencyTone],
          )}
        >
          <Clock className="h-3 w-3" aria-hidden />
          {urgencyLabel}
        </span>
      </div>

      {/* Primary / secondary copy */}
      <p className="line-clamp-1 text-xs text-foreground/80 text-center">{primaryLine}</p>
      {secondaryLine && (
        <p className="line-clamp-1 text-[11px] text-muted-foreground text-center">{secondaryLine}</p>
      )}
    </Link>
  );
}
