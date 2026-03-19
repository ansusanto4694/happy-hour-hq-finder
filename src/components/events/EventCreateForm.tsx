import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Plus, Upload, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { EVENT_CATEGORIES, DAY_NAMES, type EventFormData } from '@/hooks/useManageEvents';

interface EventCreateFormProps {
  onSubmit: (data: EventFormData) => void;
  isSubmitting: boolean;
  onCancel: () => void;
}

export const EventCreateForm: React.FC<EventCreateFormProps> = ({ onSubmit, isSubmitting, onCancel }) => {
  const [eventType, setEventType] = useState<'one_time' | 'recurring'>('one_time');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [eventDate, setEventDate] = useState<Date>();
  const [recurrenceRule, setRecurrenceRule] = useState('weekly');
  const [recurrenceDay, setRecurrenceDay] = useState<number>(1);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadImage = async (): Promise<string | undefined> => {
    if (!imageFile) return undefined;
    setIsUploading(true);
    try {
      const ext = imageFile.name.split('.').pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('event-images').upload(path, imageFile);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('event-images').getPublicUrl(path);
      return publicUrl;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const uploadedUrl = await uploadImage();
    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      image_url: uploadedUrl,
      event_type: eventType,
      event_date: eventType === 'one_time' && eventDate ? eventDate.toISOString() : undefined,
      recurrence_rule: eventType === 'recurring' ? recurrenceRule : undefined,
      recurrence_day: eventType === 'recurring' ? recurrenceDay : undefined,
      start_time: startTime || undefined,
      end_time: endTime || undefined,
      category_tags: selectedTags,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Event Type Toggle */}
      <div className="space-y-2">
        <Label>Event Type</Label>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant={eventType === 'one_time' ? 'default' : 'outline'} onClick={() => setEventType('one_time')}>
            One-Time
          </Button>
          <Button type="button" size="sm" variant={eventType === 'recurring' ? 'default' : 'outline'} onClick={() => setEventType('recurring')}>
            Recurring
          </Button>
        </div>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="event-title">Title *</Label>
        <Input id="event-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. NBA Watch Party" required />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="event-desc">Description</Label>
        <Textarea id="event-desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="Tell people what to expect..." rows={3} />
      </div>

      {/* Image Upload */}
      <div className="space-y-2">
        <Label>Event Image</Label>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
        {imagePreview ? (
          <div className="relative w-full h-48 rounded-lg overflow-hidden border border-border">
            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            <button type="button" onClick={removeImage} className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <Button type="button" variant="outline" className="w-full h-24 border-dashed" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-5 w-5 mr-2 text-muted-foreground" />
            <span className="text-muted-foreground">Upload image</span>
          </Button>
        )}
      </div>

      {/* One-time: Date Picker */}
      {eventType === 'one_time' && (
        <div className="space-y-2">
          <Label>Event Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !eventDate && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {eventDate ? format(eventDate, 'PPP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={eventDate} onSelect={setEventDate} initialFocus className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* Recurring: Day + Rule */}
      {eventType === 'recurring' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Day of Week</Label>
            <Select value={String(recurrenceDay)} onValueChange={v => setRecurrenceDay(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DAY_NAMES.map((name, i) => (
                  <SelectItem key={i} value={String(i)}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Frequency</Label>
            <Select value={recurrenceRule} onValueChange={setRecurrenceRule}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="biweekly">Biweekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Start/End Time */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start-time">Start Time</Label>
          <Input id="start-time" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end-time">End Time</Label>
          <Input id="end-time" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
        </div>
      </div>

      {/* Category Tags */}
      <div className="space-y-2">
        <Label>Category Tags</Label>
        <div className="flex flex-wrap gap-2">
          {EVENT_CATEGORIES.map(tag => (
            <Badge
              key={tag}
              variant={selectedTags.includes(tag) ? 'default' : 'outline'}
              className="cursor-pointer capitalize"
              onClick={() => toggleTag(tag)}
            >
              {tag.replace('-', ' ')}
            </Badge>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting || !title.trim()}>
          <Plus className="h-4 w-4 mr-2" />
          {isSubmitting ? 'Creating...' : 'Create Event'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
};
