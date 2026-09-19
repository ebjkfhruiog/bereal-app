import { clsx } from 'clsx';
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';

export function Card({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx('rounded-3xl bg-white shadow-card border border-ink-100/60 p-5', className)} {...rest}>
      {children}
    </div>
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'accent' | 'danger';
  size?: 'md' | 'lg' | 'sm';
  fullWidth?: boolean;
}

const VARIANT_CLASSES: Record<string, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-700 shadow-pop',
  accent: 'bg-accent-500 text-white hover:bg-accent-600 active:bg-accent-600 shadow-pop',
  secondary: 'bg-brand-50 text-brand-700 hover:bg-brand-100',
  ghost: 'bg-transparent text-ink-600 hover:bg-ink-100',
  danger: 'bg-red-50 text-red-600 hover:bg-red-100',
};

const SIZE_CLASSES: Record<string, string> = {
  sm: 'text-sm px-3.5 py-2 rounded-xl',
  md: 'text-[15px] px-5 py-3 rounded-2xl',
  lg: 'text-base px-6 py-4 rounded-2xl',
};

export function Button({ variant = 'primary', size = 'md', fullWidth, className, children, disabled, ...rest }: ButtonProps) {
  return (
    <button
      className={clsx(
        'font-semibold transition-all duration-150 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none inline-flex items-center justify-center gap-2 select-none',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={clsx('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold', className)}>
      {children}
    </span>
  );
}

export function IconButton({ className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center rounded-full w-10 h-10 text-ink-600 hover:bg-ink-100 active:scale-95 transition-all',
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function EmptyState({ icon, title, subtitle, action }: { icon?: ReactNode; title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center gap-2 py-10 px-6">
      {icon && <div className="text-4xl mb-1">{icon}</div>}
      <p className="font-semibold text-ink-800">{title}</p>
      {subtitle && <p className="text-sm text-ink-500 max-w-xs">{subtitle}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={clsx('animate-spin rounded-full border-2 border-current border-t-transparent', className)}
      style={{ width: 20, height: 20 }}
    />
  );
}
