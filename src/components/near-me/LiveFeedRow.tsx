import { ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface LiveFeedRowProps {
  title: string;
  /** e.g. "Showing within 2 mi" */
  hint?: string;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  children?: ReactNode;
  className?: string;
}

export function LiveFeedRow({
  title,
  hint,
  isLoading,
  isEmpty,
  emptyMessage = 'Nothing here right now.',
  children,
  className,
}: LiveFeedRowProps) {
  return (
    <section className={cn('w-full', className)}>
      <div className="flex items-baseline justify-between px-4 pb-2">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
      </div>

      {isLoading ? (
        <div className="flex gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex w-52 shrink-0 flex-col items-center gap-2 rounded-xl border p-3">
              <Skeleton className="h-20 w-20 rounded-lg" />
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : isEmpty ? (
        <div className="mx-4 rounded-lg border border-dashed border-border/60 px-3 py-6 text-center text-xs text-muted-foreground">
          {emptyMessage}
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {children}
        </div>
      )}
    </section>
  );
}
