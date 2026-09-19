import { useState } from 'react';
import { Button } from './ui';
import { FieldLabel, Select, TextInput, WeekdayPicker } from './formFields';
import { CATEGORIES, type Category, type Recurrence, type ScheduleEvent } from '../lib/types';
import { todayStr } from '../lib/datetime';

export interface EventFormValues {
  name: string;
  category: Category;
  date: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  recurrence: Recurrence;
  notes: string;
}

function defaultsFrom(event?: ScheduleEvent): EventFormValues {
  return {
    name: event?.name ?? '',
    category: event?.category ?? 'School',
    date: event?.date ?? todayStr(),
    daysOfWeek: event?.daysOfWeek ?? [1, 2, 3, 4, 5],
    startTime: event?.startTime ?? '08:00',
    endTime: event?.endTime ?? '09:00',
    recurrence: event?.recurrence ?? 'none',
    notes: event?.notes ?? '',
  };
}

export function EventForm({
  event,
  onSubmit,
  onCancel,
  submitLabel = 'Add to schedule',
}: {
  event?: ScheduleEvent;
  onSubmit: (values: EventFormValues) => Promise<void> | void;
  onCancel?: () => void;
  submitLabel?: string;
}) {
  const [values, setValues] = useState<EventFormValues>(defaultsFrom(event));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof EventFormValues>(key: K, val: EventFormValues[K]) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (values.startTime >= values.endTime) {
      setError('End time must be after start time.');
      return;
    }
    if (values.recurrence === 'weekly' && values.daysOfWeek.length === 0) {
      setError('Pick at least one day for a weekly event.');
      return;
    }
    setSaving(true);
    try {
      await onSubmit(values);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <FieldLabel>Event name</FieldLabel>
        <TextInput required placeholder="Soccer Practice" value={values.name} onChange={(e) => set('name', e.target.value)} />
      </div>

      <div>
        <FieldLabel>Category</FieldLabel>
        <Select value={values.category} onChange={(e) => set('category', e.target.value as Category)}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>Start time</FieldLabel>
          <TextInput type="time" required value={values.startTime} onChange={(e) => set('startTime', e.target.value)} />
        </div>
        <div>
          <FieldLabel>End time</FieldLabel>
          <TextInput type="time" required value={values.endTime} onChange={(e) => set('endTime', e.target.value)} />
        </div>
      </div>

      <div>
        <FieldLabel>Repeat</FieldLabel>
        <Select value={values.recurrence} onChange={(e) => set('recurrence', e.target.value as Recurrence)}>
          <option value="none">Doesn't repeat</option>
          <option value="weekly">Weekly on selected days</option>
          <option value="daily">Every day</option>
        </Select>
      </div>

      {values.recurrence === 'weekly' && (
        <div>
          <FieldLabel>Which days?</FieldLabel>
          <WeekdayPicker value={values.daysOfWeek} onChange={(days) => set('daysOfWeek', days)} />
        </div>
      )}

      {values.recurrence === 'none' && (
        <div>
          <FieldLabel>Date</FieldLabel>
          <TextInput type="date" required value={values.date} onChange={(e) => set('date', e.target.value)} />
        </div>
      )}

      <div>
        <FieldLabel>Notes (optional)</FieldLabel>
        <TextInput placeholder="Bring cleats" value={values.notes} onChange={(e) => set('notes', e.target.value)} />
      </div>

      {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

      <div className="flex gap-2 mt-1">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={saving} className="flex-1">
          {saving ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
