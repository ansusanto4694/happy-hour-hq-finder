import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Trash2 } from 'lucide-react';
import type { MerchantOffer, OfferFormData } from '@/hooks/useManageOffers';

interface OfferFormProps {
  initialData?: MerchantOffer;
  onSubmit: (data: OfferFormData) => void;
  isSubmitting: boolean;
  onCancel: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
  onToggleActive?: (isActive: boolean) => void;
}

const toDatetimeLocal = (iso: string) => {
  const d = new Date(iso);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
};

export const OfferForm: React.FC<OfferFormProps> = ({
  initialData,
  onSubmit,
  isSubmitting,
  onCancel,
  onDelete,
  isDeleting,
  onToggleActive,
}) => {
  const [name, setName] = useState(initialData?.offer_name ?? '');
  const [description, setDescription] = useState(initialData?.offer_description ?? '');
  const [startTime, setStartTime] = useState(initialData ? toDatetimeLocal(initialData.start_time) : '');
  const [endTime, setEndTime] = useState(initialData ? toDatetimeLocal(initialData.end_time) : '');
  const [pin, setPin] = useState(initialData?.redemption_pin ?? '');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !startTime || !endTime) {
      setError('Please fill in all required fields.');
      return;
    }
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (end <= start) {
      setError('End time must be after start time.');
      return;
    }
    setError('');
    onSubmit({
      offer_name: name.trim(),
      offer_description: description.trim() || null,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {initialData && onToggleActive && (
        <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
          <Label htmlFor="offer-active" className="text-sm font-medium">Active</Label>
          <Switch
            id="offer-active"
            checked={initialData.is_active}
            onCheckedChange={onToggleActive}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="offer-name">Offer Name *</Label>
        <Input id="offer-name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. 20% Off Appetizers" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="offer-desc">Description</Label>
        <Textarea id="offer-desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="Details about the offer..." rows={3} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="offer-start">Start Date & Time *</Label>
          <Input id="offer-start" type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="offer-end">End Date & Time *</Label>
          <Input id="offer-end" type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center justify-between pt-2">
        <div>
          {initialData && onDelete && (
            <Button type="button" variant="destructive" size="sm" onClick={onDelete} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Trash2 className="h-4 w-4 mr-1" />}
              Delete
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            {initialData ? 'Save Changes' : 'Create Offer'}
          </Button>
        </div>
      </div>
    </form>
  );
};
