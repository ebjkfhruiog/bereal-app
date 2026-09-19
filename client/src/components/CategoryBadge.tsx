import { clsx } from 'clsx';
import type { Category } from '../lib/types';

export const CATEGORY_STYLES: Record<Category, { bg: string; text: string; dot: string; emoji: string }> = {
  School: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', emoji: '📘' },
  Sports: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', emoji: '⚽' },
  Extracurricular: { bg: 'bg-violet-50', text: 'text-violet-700', dot: 'bg-violet-500', emoji: '🎭' },
  Work: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', emoji: '💼' },
  Family: { bg: 'bg-pink-50', text: 'text-pink-700', dot: 'bg-pink-500', emoji: '🏠' },
  Homework: { bg: 'bg-cyan-50', text: 'text-cyan-700', dot: 'bg-cyan-500', emoji: '📝' },
  Other: { bg: 'bg-ink-100', text: 'text-ink-600', dot: 'bg-ink-400', emoji: '•' },
};

export function CategoryBadge({ category, className }: { category: Category; className?: string }) {
  const style = CATEGORY_STYLES[category] ?? CATEGORY_STYLES.Other;
  return (
    <span className={clsx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold', style.bg, style.text, className)}>
      <span className={clsx('w-1.5 h-1.5 rounded-full', style.dot)} />
      {category}
    </span>
  );
}
