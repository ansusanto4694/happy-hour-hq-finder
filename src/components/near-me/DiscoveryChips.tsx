import { cn } from '@/lib/utils';

export type DiscoveryCategory = 'all' | 'happy_hour' | 'trivia' | 'live_music' | 'dj' | 'karaoke';

interface Chip {
  id: DiscoveryCategory;
  label: string;
  emoji: string;
}

const CHIPS: Chip[] = [
  { id: 'all', label: 'All', emoji: '✨' },
  { id: 'happy_hour', label: 'Happy hour', emoji: '🍹' },
  { id: 'trivia', label: 'Trivia', emoji: '🧠' },
  { id: 'live_music', label: 'Live music', emoji: '🎶' },
  { id: 'dj', label: 'DJ', emoji: '🎧' },
  { id: 'karaoke', label: 'Karaoke', emoji: '🎤' },
];

interface DiscoveryChipsProps {
  active: DiscoveryCategory;
  onChange: (id: DiscoveryCategory) => void;
}

export function DiscoveryChips({ active, onChange }: DiscoveryChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {CHIPS.map((chip) => {
        const isActive = chip.id === active;
        return (
          <button
            key={chip.id}
            type="button"
            onClick={() => onChange(chip.id)}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors min-h-[36px]',
              isActive
                ? 'bg-foreground text-background'
                : 'bg-muted text-foreground hover:bg-muted/80',
            )}
            aria-pressed={isActive}
          >
            <span aria-hidden>{chip.emoji}</span>
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
