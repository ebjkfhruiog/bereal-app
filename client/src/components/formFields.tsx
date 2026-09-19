import { clsx } from 'clsx';
import { WEEKDAY_LABELS } from '../lib/datetime';

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-sm font-semibold text-ink-600 mb-1.5 block">{children}</label>;
}

export const inputClass =
  'w-full rounded-xl border border-ink-200 px-3.5 py-2.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white';

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={clsx(inputClass, props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={clsx(inputClass, 'appearance-none', props.className)} />;
}

export function WeekdayPicker({ value, onChange }: { value: number[]; onChange: (days: number[]) => void }) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {WEEKDAY_LABELS.map((label, idx) => {
        const active = value.includes(idx);
        return (
          <button
            type="button"
            key={idx}
            onClick={() => onChange(active ? value.filter((d) => d !== idx) : [...value, idx].sort())}
            className={clsx(
              'w-11 h-11 rounded-xl text-xs font-bold transition-colors',
              active ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-500 hover:bg-ink-200'
            )}
          >
            {label[0]}
          </button>
        );
      })}
    </div>
  );
}
