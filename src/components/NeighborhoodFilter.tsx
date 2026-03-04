import React, { useState, useMemo } from 'react';
import { Check, ChevronsUpDown, MapPin, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { cn } from '@/lib/utils';

interface NeighborhoodFilterProps {
  neighborhoods: { name: string; count: number }[];
  selected: string | null;
  onChange: (value: string | null) => void;
}

export const NeighborhoodFilter: React.FC<NeighborhoodFilterProps> = ({
  neighborhoods,
  selected,
  onChange,
}) => {
  const [open, setOpen] = useState(false);

  const sortedNeighborhoods = useMemo(
    () => [...neighborhoods].sort((a, b) => b.count - a.count),
    [neighborhoods]
  );

  const displayLabel = selected || 'All Neighborhoods';

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="justify-between min-w-[220px] bg-card"
          >
            <span className="flex items-center gap-2 truncate">
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              <span className="truncate">{displayLabel}</span>
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search neighborhoods..." />
            <CommandList>
              <CommandEmpty>No neighborhood found.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value="all-neighborhoods"
                  onSelect={() => {
                    onChange(null);
                    setOpen(false);
                  }}
                >
                  <Check className={cn('mr-2 h-4 w-4', !selected ? 'opacity-100' : 'opacity-0')} />
                  <span className="font-medium">All Neighborhoods</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {neighborhoods.reduce((sum, n) => sum + n.count, 0)}
                  </span>
                </CommandItem>
                {sortedNeighborhoods.map((hood) => (
                  <CommandItem
                    key={hood.name}
                    value={hood.name}
                    onSelect={() => {
                      onChange(hood.name === selected ? null : hood.name);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        selected === hood.name ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <span>{hood.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{hood.count}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selected && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onChange(null)}
          aria-label="Clear neighborhood filter"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
