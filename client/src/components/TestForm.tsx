import { useState } from 'react';
import { Button } from './ui';
import { FieldLabel, Select, TextInput } from './formFields';
import type { Difficulty, TestItem } from '../lib/types';
import { todayStr, addDays } from '../lib/datetime';

export interface TestFormValues {
  subject: string;
  name: string;
  date: string;
  difficulty: Difficulty;
  dailyStudyMinutes: number;
  notes: string;
}

function defaultsFrom(test?: TestItem, defaultMinutes?: number): TestFormValues {
  return {
    subject: test?.subject ?? '',
    name: test?.name ?? '',
    date: test?.date ?? addDays(todayStr(), 7),
    difficulty: test?.difficulty ?? 'medium',
    dailyStudyMinutes: test?.dailyStudyMinutes ?? defaultMinutes ?? 30,
    notes: test?.notes ?? '',
  };
}

export function TestForm({
  test,
  defaultMinutes,
  onSubmit,
  onCancel,
  submitLabel = 'Add test',
}: {
  test?: TestItem;
  defaultMinutes?: number;
  onSubmit: (values: TestFormValues) => Promise<void> | void;
  onCancel?: () => void;
  submitLabel?: string;
}) {
  const [values, setValues] = useState<TestFormValues>(defaultsFrom(test, defaultMinutes));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof TestFormValues>(key: K, val: TestFormValues[K]) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
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
        <FieldLabel>Subject</FieldLabel>
        <TextInput required placeholder="History" value={values.subject} onChange={(e) => set('subject', e.target.value)} />
      </div>
      <div>
        <FieldLabel>Test / assignment name</FieldLabel>
        <TextInput required placeholder="Unit 2 Test" value={values.name} onChange={(e) => set('name', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>Date</FieldLabel>
          <TextInput type="date" required value={values.date} onChange={(e) => set('date', e.target.value)} />
        </div>
        <div>
          <FieldLabel>Difficulty</FieldLabel>
          <Select value={values.difficulty} onChange={(e) => set('difficulty', e.target.value as Difficulty)}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </Select>
        </div>
      </div>
      <div>
        <FieldLabel>Daily study goal: {values.dailyStudyMinutes} min</FieldLabel>
        <input
          type="range"
          min={15}
          max={120}
          step={15}
          value={values.dailyStudyMinutes}
          onChange={(e) => set('dailyStudyMinutes', Number(e.target.value))}
          className="w-full accent-brand-600"
        />
      </div>
      <div>
        <FieldLabel>Notes (optional)</FieldLabel>
        <TextInput placeholder="Chapters 4-6" value={values.notes} onChange={(e) => set('notes', e.target.value)} />
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
