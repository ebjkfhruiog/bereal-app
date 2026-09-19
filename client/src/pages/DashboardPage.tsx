import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dices, Play, Sparkles } from 'lucide-react';
import { ScreenHeader } from '../components/NavShell';
import { Button, Card, EmptyState, Spinner } from '../components/ui';
import { CategoryBadge, CATEGORY_STYLES } from '../components/CategoryBadge';
import { AdSlot } from '../components/AdSlot';
import { EventsApi, SessionsApi, TestsApi } from '../lib/resources';
import type { ScheduleEvent, StudySession, TestItem } from '../lib/types';
import { eventsOnDate } from '../lib/eventOccurs';
import { daysAwayLabel, formatTime12h, friendlyDayLabel, minutesBetween, todayStr } from '../lib/datetime';
import { quoteForToday } from '../lib/quotes';
import { useCountdown } from '../lib/useCountdown';
import { useToastStore } from '../store/toast';
import { useAuth } from '../store/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const push = useToastStore((s) => s.push);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [tests, setTests] = useState<TestItem[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [planning, setPlanning] = useState(false);
  const today = todayStr();

  async function loadAll() {
    const [eventsRes, testsRes, sessionsRes] = await Promise.all([
      EventsApi.list(),
      TestsApi.list(),
      SessionsApi.listByDate(today),
    ]);
    setEvents(eventsRes.events);
    setTests(testsRes.tests);
    setSessions(sessionsRes.sessions);
  }

  useEffect(() => {
    loadAll().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const todaysEvents = useMemo(() => eventsOnDate(events, today), [events, today]);
  const upcomingTests = useMemo(
    () => tests.filter((t) => t.date >= today).sort((a, b) => (a.date < b.date ? -1 : 1)).slice(0, 5),
    [tests, today]
  );
  const nextSession = useMemo(
    () => [...sessions].filter((s) => !s.completed).sort((a, b) => (a.startTime < b.startTime ? -1 : 1))[0],
    [sessions]
  );

  const timeline = useMemo(() => {
    const items = [
      ...todaysEvents.map((e) => ({
        kind: 'event' as const,
        key: e.id,
        name: e.name,
        category: e.category,
        startTime: e.startTime,
        endTime: e.endTime,
      })),
      ...sessions.map((s) => ({
        kind: 'session' as const,
        key: s.id,
        name: `${s.subject} study session`,
        category: 'Homework' as const,
        startTime: s.startTime,
        endTime: s.endTime,
        completed: s.completed,
      })),
    ];
    return items.sort((a, b) => (a.startTime < b.startTime ? -1 : 1));
  }, [todaysEvents, sessions]);

  async function handlePlanDay() {
    setPlanning(true);
    try {
      const res = await SessionsApi.generate(today);
      if (res.sessions.length > 0) {
        push(`Stubby scheduled ${res.sessions.length} study session${res.sessions.length > 1 ? 's' : ''} today.`, 'success');
      } else if (res.skipped.length > 0) {
        push("No free time left today — try adjusting your schedule.", 'error');
      } else {
        push('Add a test first so Stubby knows what to study.', 'info');
      }
      await loadAll();
    } catch {
      push('Could not plan today. Try again.', 'error');
    } finally {
      setPlanning(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20 text-brand-600">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-up">
      <ScreenHeader title={`Hey ${user?.name?.split(' ')[0] ?? ''} 👋`} subtitle={friendlyDayLabel(today)} />

      {nextSession ? (
        <NextSessionCard session={nextSession} onChanged={loadAll} />
      ) : (
        <Card className="bg-gradient-to-br from-brand-600 to-brand-700 text-white border-none">
          <p className="font-display font-bold text-lg">No study session queued yet</p>
          <p className="text-brand-100 text-sm mt-1 mb-4">Let Stubby find your next free window and decide for you.</p>
          <Button variant="accent" onClick={handlePlanDay} disabled={planning}>
            <Sparkles size={16} /> {planning ? 'Planning…' : 'Plan my day'}
          </Button>
        </Card>
      )}

      <MotivationBanner />

      <section>
        <SectionTitle>Today's Schedule</SectionTitle>
        {timeline.length === 0 ? (
          <Card>
            <EmptyState icon="🗓️" title="Nothing on the books today" subtitle="Add commitments in Schedule so Stubby knows when you're busy." />
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {timeline.map((item) => (
              <TimelineRow key={item.key} item={item} />
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionTitle>Upcoming Tests</SectionTitle>
        {upcomingTests.length === 0 ? (
          <Card>
            <EmptyState icon="📚" title="No tests on the radar" subtitle="Add one in Study so Stubby can start planning sessions." />
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {upcomingTests.map((t) => (
              <Card key={t.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-ink-800 text-sm">
                    {t.subject} <span className="text-ink-400 font-normal">· {t.name}</span>
                  </p>
                  <p className="text-xs text-ink-500 mt-0.5">
                    {friendlyDayLabel(t.date)} · Study goal: {t.dailyStudyMinutes} min/day
                  </p>
                </div>
                <span className="text-xs font-bold text-brand-600 whitespace-nowrap ml-3">{daysAwayLabel(t.date)}</span>
              </Card>
            ))}
          </div>
        )}
      </section>

      <AdSlot slot="dashboard-footer" />
    </div>
  );
}

function NextSessionCard({ session, onChanged }: { session: StudySession; onChanged: () => Promise<void> }) {
  const navigate = useNavigate();
  const push = useToastStore((s) => s.push);
  const countdown = useCountdown(session.date, session.startTime);
  const [randomizing, setRandomizing] = useState(false);
  const duration = minutesBetween(session.startTime, session.endTime);

  async function handleRandomize() {
    setRandomizing(true);
    try {
      await SessionsApi.randomize(session.id);
      await onChanged();
      push('New time picked!', 'success');
    } catch (err) {
      push(err instanceof Error ? err.message : 'Could not find another slot.', 'error');
    } finally {
      setRandomizing(false);
    }
  }

  return (
    <Card className="bg-gradient-to-br from-brand-600 to-brand-700 text-white border-none relative overflow-hidden">
      <p className="text-brand-100 text-xs font-bold tracking-widest uppercase">Next Study Session</p>
      <p className="font-display text-2xl font-extrabold mt-1">{session.subject.toUpperCase()}</p>
      <p className="text-brand-100 font-medium mt-0.5">
        {formatTime12h(session.startTime)} – {formatTime12h(session.endTime)} · {duration} minutes
      </p>

      {!countdown.hasStarted ? (
        <p className="mt-3 text-sm font-semibold bg-white/15 inline-block px-3 py-1.5 rounded-full">Starts in {countdown.label}</p>
      ) : (
        <p className="mt-3 text-sm font-semibold bg-white/15 inline-block px-3 py-1.5 rounded-full">🔔 It's go time</p>
      )}

      <div className="flex gap-2 mt-5">
        <Button variant="accent" size="lg" className="flex-1" onClick={() => navigate(`/session/${session.id}`)}>
          <Play size={18} fill="currentColor" /> Start Study
        </Button>
        <Button
          variant="secondary"
          size="lg"
          className="bg-white/15 text-white hover:bg-white/25"
          onClick={handleRandomize}
          disabled={randomizing}
          aria-label="Randomize again"
        >
          <Dices size={18} />
        </Button>
      </div>
    </Card>
  );
}

function MotivationBanner() {
  const [quote] = useState(quoteForToday);
  return (
    <div className="rounded-2xl bg-accent-50 border border-accent-100 px-4 py-3 flex items-center gap-3">
      <span className="text-xl">💡</span>
      <p className="text-sm font-medium text-accent-600">{quote}</p>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display font-bold text-ink-800 mb-2.5">{children}</h2>;
}

function TimelineRow({
  item,
}: {
  item: { kind: 'event' | 'session'; key: string; name: string; category: keyof typeof CATEGORY_STYLES; startTime: string; endTime: string; completed?: boolean };
}) {
  return (
    <Card className="p-4 flex items-center gap-3">
      <div className="w-16 shrink-0 text-xs font-bold text-ink-500 leading-tight">
        {formatTime12h(item.startTime)}
        <br />
        {formatTime12h(item.endTime)}
      </div>
      <div className="w-px self-stretch bg-ink-100" />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${item.completed ? 'line-through text-ink-400' : 'text-ink-800'}`}>{item.name}</p>
      </div>
      {item.kind === 'session' ? (
        <span className="text-xs font-bold text-brand-600 bg-brand-50 rounded-full px-2.5 py-1 shrink-0">
          {item.completed ? '✓ Done' : 'Study'}
        </span>
      ) : (
        <CategoryBadge category={item.category} className="shrink-0" />
      )}
    </Card>
  );
}
