import React, { useState, useEffect } from 'react';
import { useMerchantStoreHours } from '@/hooks/useMerchantStoreHours';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Save, Loader2 } from 'lucide-react';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface DayRow {
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

const defaultRows = (): DayRow[] =>
  Array.from({ length: 7 }, (_, i) => ({
    day_of_week: i,
    open_time: '09:00',
    close_time: '22:00',
    is_closed: false,
  }));

interface PortalStoreHoursProps {
  merchantId: number;
}

export const PortalStoreHours: React.FC<PortalStoreHoursProps> = ({ merchantId }) => {
  const { storeHours, isLoading, saveStoreHours } = useMerchantStoreHours(merchantId);
  const [rows, setRows] = useState<DayRow[]>(defaultRows());

  useEffect(() => {
    if (storeHours && storeHours.length > 0) {
      const merged = defaultRows().map(d => {
        const existing = storeHours.find(s => s.day_of_week === d.day_of_week);
        return existing
          ? { day_of_week: existing.day_of_week, open_time: existing.open_time, close_time: existing.close_time, is_closed: existing.is_closed }
          : d;
      });
      setRows(merged);
    }
  }, [storeHours]);

  const updateRow = (index: number, field: keyof DayRow, value: any) => {
    setRows(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
  };

  const handleSave = () => {
    saveStoreHours.mutate(rows);
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Store Hours</h2>
          <p className="text-sm text-muted-foreground mt-1">Set your regular operating hours</p>
        </div>
        <Button onClick={handleSave} disabled={saveStoreHours.isPending}>
          <Save className="h-4 w-4 mr-2" />
          {saveStoreHours.isPending ? 'Saving...' : 'Save Hours'}
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {rows.map((row, index) => (
              <div key={row.day_of_week} className="flex items-center gap-4 p-3 rounded-lg border border-border">
                <span className="w-24 text-sm font-medium text-foreground">{DAY_NAMES[row.day_of_week]}</span>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={!row.is_closed}
                    onCheckedChange={(open) => updateRow(index, 'is_closed', !open)}
                  />
                  <Label className="text-xs text-muted-foreground w-12">
                    {row.is_closed ? 'Closed' : 'Open'}
                  </Label>
                </div>

                {!row.is_closed && (
                  <>
                    <Input
                      type="time"
                      value={row.open_time}
                      onChange={e => updateRow(index, 'open_time', e.target.value)}
                      className="w-32"
                    />
                    <span className="text-muted-foreground text-sm">to</span>
                    <Input
                      type="time"
                      value={row.close_time}
                      onChange={e => updateRow(index, 'close_time', e.target.value)}
                      className="w-32"
                    />
                  </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
