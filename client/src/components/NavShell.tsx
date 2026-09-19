import { CalendarDays, Home, ListChecks, type LucideIcon, Sparkles, User as UserIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { clsx } from 'clsx';
import { Logo } from './Logo';
import { useAuth } from '../store/AuthContext';

const NAV_ITEMS: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/schedule', label: 'Schedule', icon: CalendarDays },
  { to: '/study', label: 'Study', icon: ListChecks },
  { to: '/stats', label: 'Stats', icon: Sparkles },
  { to: '/profile', label: 'Profile', icon: UserIcon },
];

export function NavShell() {
  return (
    <div className="min-h-dvh bg-ink-50 flex">
      <DesktopSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <MobileTopBar />
        <main className="flex-1 max-w-2xl w-full mx-auto px-4 pt-4 pb-28 md:pb-10 md:pt-8">
          <Outlet />
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}

function MobileTopBar() {
  return (
    <header className="md:hidden sticky top-0 z-30 bg-ink-50/90 backdrop-blur border-b border-ink-100 px-4 py-3 flex items-center justify-between">
      <Logo size={26} />
    </header>
  );
}

function DesktopSidebar() {
  const { user } = useAuth();
  return (
    <aside className="hidden md:flex md:w-60 lg:w-64 flex-col border-r border-ink-100 bg-white px-4 py-6 shrink-0">
      <div className="px-2 mb-8">
        <Logo size={30} />
      </div>
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>
      <div className="mt-auto px-2 pt-6">
        {!user?.isPremium && (
          <NavLink
            to="/upgrade"
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-700 text-white px-4 py-3 text-sm font-semibold shadow-pop"
          >
            <Sparkles size={16} /> Get Stubby+
          </NavLink>
        )}
      </div>
    </aside>
  );
}

function NavItem({ to, label, icon: Icon }: { to: string; label: string; icon: LucideIcon }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        clsx(
          'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
          isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-500 hover:bg-ink-100 hover:text-ink-700'
        )
      }
    >
      <Icon size={19} strokeWidth={2.2} />
      {label}
    </NavLink>
  );
}

function MobileBottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-ink-100 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-2xl mx-auto flex items-stretch justify-between px-2">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              clsx(
                'flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-semibold transition-colors',
                isActive ? 'text-brand-600' : 'text-ink-400'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={22} strokeWidth={isActive ? 2.4 : 2} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export function ScreenHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-ink-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
