import type { ScheduleEvent } from './types';

export function occursOnDate(event: ScheduleEvent, dateStr: string): boolean {
  const target = new Date(dateStr + 'T00:00:00');
  if (event.recurrence === 'none') return event.date === dateStr;
  if (event.recurrence === 'weekly') {
    const startOk = !event.date || new Date(event.date + 'T00:00:00') <= target;
    const untilOk = !event.untilDate || new Date(event.untilDate + 'T00:00:00') >= target;
    return startOk && untilOk && event.daysOfWeek.includes(target.getDay());
  }
  if (event.recurrence === 'daily') {
    const startOk = !event.date || new Date(event.date + 'T00:00:00') <= target;
    const untilOk = !event.untilDate || new Date(event.untilDate + 'T00:00:00') >= target;
    return startOk && untilOk;
  }
  return false;
}

export function eventsOnDate(events: ScheduleEvent[], dateStr: string): ScheduleEvent[] {
  return events.filter((e) => occursOnDate(e, dateStr));
}
