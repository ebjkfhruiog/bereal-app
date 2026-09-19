import { clsx } from 'clsx';
import { useToastStore } from '../store/toast';

export function ToastHost() {
  const toasts = useToastStore((s) => s.toasts);
  return (
    <div className="fixed top-3 inset-x-0 z-50 flex flex-col items-center gap-2 px-4 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={clsx(
            'animate-pop pointer-events-auto rounded-2xl px-4 py-2.5 text-sm font-semibold shadow-pop max-w-sm text-center',
            t.variant === 'success' && 'bg-mint-500 text-white',
            t.variant === 'error' && 'bg-red-500 text-white',
            t.variant === 'info' && 'bg-ink-800 text-white'
          )}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
