/**
 * Virtual instance logic for merchant events.
 * Computes `nextDate` for both one-time and recurring events,
 * enabling natural chronological sorting without duplicating data.
 */

export interface EventWithNextDate {
  id: number;
  restaurant_id: number;
  title: string;
  description: string | null;
  image_url: string | null;
  event_date: string | null;
  event_type: string;
  recurrence_rule: string | null;
  recurrence_day: number | null;
  start_time: string | null;
  end_time: string | null;
  category_tags: string[] | null;
  is_active: boolean;
  repeat_until: string | null;
  created_at: string;
  updated_at: string;
  nextDate: Date | null;
  isPast: boolean;
}

/**
 * For a recurring event with a recurrence_day (0=Sun … 6=Sat),
 * compute the next occurrence date from today.
 * If repeat_until is set and the next occurrence would be after it, returns null.
 */
export const getNextOccurrence = (event: {
  event_type: string;
  event_date: string | null;
  recurrence_day: number | null;
  repeat_until: string | null;
}): Date | null => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (event.event_type === 'one_time') {
    if (!event.event_date) return null;
    return new Date(event.event_date);
  }

  // Recurring event
  if (event.recurrence_day == null) return null;

  const currentDay = today.getDay(); // 0=Sun
  const targetDay = event.recurrence_day;
  let daysUntil = targetDay - currentDay;
  if (daysUntil < 0) daysUntil += 7;
  // If it's today, show today as the next occurrence
  if (daysUntil === 0) daysUntil = 0;

  const nextDate = new Date(today);
  nextDate.setDate(today.getDate() + daysUntil);

  // Check repeat_until boundary
  if (event.repeat_until) {
    const repeatUntil = new Date(event.repeat_until + 'T23:59:59');
    if (nextDate > repeatUntil) return null;
  }

  return nextDate;
};

/**
 * Enrich events with nextDate and isPast, filter out expired ones,
 * and sort by soonest next occurrence.
 */
export const sortEventsByNextOccurrence = <T extends {
  event_type: string;
  event_date: string | null;
  recurrence_day: number | null;
  repeat_until: string | null;
}>(events: T[]): (T & { nextDate: Date | null; isPast: boolean })[] => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return events
    .map((event) => {
      const nextDate = getNextOccurrence(event);
      const isPast = event.event_type === 'one_time' && nextDate != null && nextDate < today;
      return { ...event, nextDate, isPast };
    })
    // Filter out past one-time events and expired recurring events (null nextDate for recurring)
    .filter((event) => {
      if (event.isPast) return false;
      if (event.event_type === 'recurring' && event.nextDate === null) return false;
      return true;
    })
    // Sort by soonest nextDate first; nulls go to end
    .sort((a, b) => {
      if (!a.nextDate && !b.nextDate) return 0;
      if (!a.nextDate) return 1;
      if (!b.nextDate) return -1;
      return a.nextDate.getTime() - b.nextDate.getTime();
    });
};

/**
 * Format a date as a short human-readable string, e.g. "Wed, Mar 19"
 */
export const formatNextDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};
