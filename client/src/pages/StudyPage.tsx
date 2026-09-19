import { useEffect, useMemo, useState } from 'react';
import { Dices, Pencil, Play, Plus, Sparkles, Trash2 } from 'lucide-react';
import { ScreenHeader } from '../components/NavShell';
import { Button, Card, EmptyState, IconButton, Spinner } from '../components/ui';
import { Sheet } from '../components/Sheet';
import { TestForm, type TestFormValues } from '../components/TestForm';
import { AdSlot } from '../components/AdSlot';
import { SessionsApi, TestsApi } from '../lib/resources';
import type { StudySession, TestItem } from '../lib/types';
import { daysAwayLabel, formatTime12h, friendlyDayLabel, todayStr } from '../lib/datetime';
import { useToastStore } from '../store/toast';
import { useNavigate } from 'react-router-dom';

const DIFFICULTY_LABEL: Record<string, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };
const DIFFICULTY_COLOR: Record<string, string> = {
  easy: 'bg-mint-500/10 text-mint-600',
  medium: 'bg-amber-500/10 text-amber-600',
  hard: 'bg-red-500/10 text-red-600',
};

export default function StudyPage() {
  const push = useToastStore((s) => s.push);
  const navigate = useNavigate();
  const [tests, setTests] = useState<TestItem[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<TestItem | null>(null);
  const [planning, setPlanning] = useState(false);
  const today = todayStr();

  async function load() {
    const [testsRes, sessionsRes] = await Promise.all([TestsApi.list(), SessionsApi.listByDate(today)]);
    setTests(testsRes.tests);
    setSessions(sessionsRes.sessions);
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const upcomingTests = useMemo(() => tests.filter((t) => t.date >= today).sort((a, b) => (a.date < b.date ? -1 : 1)), [tests, today]);
  const pastTests = useMemo(() => tests.filter((t) => t.date < today), [tests, today]);

  async function handleCreate(values: TestFormValues) {
    await TestsApi.create(values);
    await load();
    setCreating(false);
    push('Test added — Stubby will factor it into your plan.', 'success');
  }

  async function handleUpdate(values: TestFormValues) {
    if (!editing) return;
    await TestsApi.update(editing.id, values);
    await load();
    setEditing(null);
    push('Test updated.', 'success');
  }

  async function handleDelete(id: string) {
    await TestsApi.remove(id);
    await load();
    setEditing(null);
    push('Test removed.', 'success');
  }

  async function handlePlanDay() {
    setPlanning(true);
    try {
      const res = await SessionsApi.generate(today);
      if (res.sessions.length > 0) {
        push(`Planned ${res.sessions.length} session${res.sessions.length > 1 ? 's' : ''} for today.`, 'success');
      } else if (res.skipped.length > 0) {
        push('No free time left today for more sessions.', 'error');
      } else {
        push('Everything for today is already planned.', 'info');
      }
      await load();
    } finally {
      setPlanning(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-up">
      <ScreenHeader
        title="Study"
        subtitle="Tests, assignments, and today's plan"
        action={
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus size={16} /> Add
          </Button>
        }
      />

      <Card className="bg-gradient-to-br from-ink-800 to-ink-900 text-white border-none">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-display font-bold">Let Stubby plan today</p>
            <p className="text-ink-300 text-xs mt-0.5">Fills your free time with sessions, prioritized automatically.</p>
          </div>
          <Button variant="accent" onClick={handlePlanDay} disabled={planning} className="shrink-0">
            <Sparkles size={16} /> {planning ? '…' : 'Plan'}
          </Button>
        </div>
      </Card>

      {sessions.length > 0 && (
        <section>
          <SectionTitle>Today's Sessions</SectionTitle>
          <div className="flex flex-col gap-2">
            {sessions.map((s) => (
              <SessionRow key={s.id} session={s} onChanged={load} onStart={() => navigate(`/session/${s.id}`)} />
            ))}
          </div>
        </section>
      )}

      <section>
        <SectionTitle>Upcoming Tests</SectionTitle>
        {loading ? (
          <div className="flex justify-center py-16 text-brand-600">
            <Spinner />
          </div>
        ) : upcomingTests.length === 0 ? (
          <Card>
            <EmptyState
              icon="📚"
              title="No tests yet"
              subtitle="Add your next test or assignment and Stubby will start scheduling study time."
              action={
                <Button variant="secondary" onClick={() => setCreating(true)}>
                  <Plus size={16} /> Add a test
                </Button>
              }
            />
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {upcomingTests.map((t) => (
              <Card key={t.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink-800 text-sm truncate">
                      {t.subject} <span className="text-ink-400 font-normal">· {t.name}</span>
                    </p>
                    <div className="flex items-center flex-wrap gap-1.5 mt-1.5">
                      <span className="text-[11px] font-bold text-brand-600 bg-brand-50 rounded-full px-2 py-0.5">{friendlyDayLabel(t.date)}</span>
                      <span className={`text-[11px] font-bold rounded-full px-2 py-0.5 ${DIFFICULTY_COLOR[t.difficulty]}`}>
                        {DIFFICULTY_LABEL[t.difficulty]}
                      </span>
                      <span className="text-[11px] font-medium text-ink-400">{t.dailyStudyMinutes} min/day</span>
                      <span className="text-[11px] font-medium text-ink-400">· {t.sessionsCompleted} done</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold text-ink-400">{daysAwayLabel(t.date)}</span>
                    <IconButton onClick={() => setEditing(t)} aria-label="Edit">
                      <Pencil size={15} />
                    </IconButton>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {pastTests.length > 0 && (
        <section>
          <SectionTitle>Past</SectionTitle>
          <div className="flex flex-col gap-2 opacity-60">
            {pastTests.map((t) => (
              <Card key={t.id} className="p-3 flex items-center justify-between">
                <p className="text-sm font-medium text-ink-600">
                  {t.subject} · {t.name}
                </p>
                <IconButton onClick={() => handleDelete(t.id)} aria-label="Delete">
                  <Trash2 size={14} />
                </IconButton>
              </Card>
            ))}
          </div>
        </section>
      )}

      <AdSlot slot="study-list-footer" />

      {creating && (
        <Sheet title="Add a test or assignment" onClose={() => setCreating(false)}>
          <TestForm onSubmit={handleCreate} onCancel={() => setCreating(false)} />
        </Sheet>
      )}

      {editing && (
        <Sheet title="Edit test" onClose={() => setEditing(null)}>
          <TestForm test={editing} submitLabel="Save changes" onSubmit={handleUpdate} />
          <button
            onClick={() => handleDelete(editing.id)}
            className="mt-4 w-full flex items-center justify-center gap-1.5 text-sm font-semibold text-red-600 py-2"
          >
            <Trash2 size={15} /> Delete this test
          </button>
        </Sheet>
      )}
    </div>
  );
}

function SessionRow({ session, onChanged, onStart }: { session: StudySession; onChanged: () => Promise<void>; onStart: () => void }) {
  const push = useToastStore((s) => s.push);
  const [busy, setBusy] = useState(false);

  async function randomize() {
    setBusy(true);
    try {
      await SessionsApi.randomize(session.id);
      await onChanged();
    } catch (err) {
      push(err instanceof Error ? err.message : 'No other slot available.', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-4 flex items-center gap-3">
      <div className="w-20 shrink-0 text-xs font-bold text-ink-500 leading-tight">
        {formatTime12h(session.startTime)}
        <br />
        {formatTime12h(session.endTime)}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${session.completed ? 'line-through text-ink-400' : 'text-ink-800'}`}>{session.subject}</p>
        <p className="text-xs text-ink-400">{session.durationMinutes} min</p>
      </div>
      {!session.completed && (
        <div className="flex items-center gap-1.5 shrink-0">
          <IconButton onClick={randomize} disabled={busy} aria-label="Randomize again">
            <Dices size={16} />
          </IconButton>
          <Button size="sm" onClick={onStart}>
            <Play size={14} fill="currentColor" /> Start
          </Button>
        </div>
      )}
      {session.completed && <span className="text-xs font-bold text-mint-600 shrink-0">✓ Done</span>}
    </Card>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display font-bold text-ink-800 mb-2.5">{children}</h2>;
}
