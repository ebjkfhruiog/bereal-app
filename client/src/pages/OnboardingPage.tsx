import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, PartyPopper, Plus } from 'lucide-react';
import { Logo } from '../components/Logo';
import { Button, Card } from '../components/ui';
import { FieldLabel, Select, TextInput } from '../components/formFields';
import { EventForm, type EventFormValues } from '../components/EventForm';
import { TestForm, type TestFormValues } from '../components/TestForm';
import { CategoryBadge } from '../components/CategoryBadge';
import { useAuth } from '../store/AuthContext';
import { AuthApi, EventsApi, SessionsApi, TestsApi } from '../lib/resources';
import { WEEKDAY_LABELS, formatTime12h, friendlyDayLabel, todayStr } from '../lib/datetime';
import type { ScheduleEvent, TestItem } from '../lib/types';
import { useToastStore } from '../store/toast';

const STEPS = ['You', 'Schedule', 'Tests', 'Goal', 'Done'] as const;

export default function OnboardingPage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const push = useToastStore((s) => s.push);

  const [step, setStep] = useState(0);
  const [name, setName] = useState(user?.name ?? '');
  const [grade, setGrade] = useState(user?.grade ?? '9');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [subjectDraft, setSubjectDraft] = useState('');

  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [showEventForm, setShowEventForm] = useState(false);

  const [tests, setTests] = useState<TestItem[]>([]);
  const [showTestForm, setShowTestForm] = useState(false);

  const [dailyGoal, setDailyGoal] = useState(30);
  const [wakeTime, setWakeTime] = useState(user?.studyWindowStart ?? '07:00');
  const [sleepTime, setSleepTime] = useState(user?.studyWindowEnd ?? '22:30');
  const [finishing, setFinishing] = useState(false);

  async function handleAddEvent(values: EventFormValues) {
    const { event } = await EventsApi.create(values);
    setEvents((e) => [...e, event]);
    setShowEventForm(false);
  }

  async function handleAddTest(values: TestFormValues) {
    const { test } = await TestsApi.create(values);
    setTests((t) => [...t, test]);
    setShowTestForm(false);
    if (!subjects.includes(test.subject)) setSubjects((s) => [...s, test.subject]);
  }

  function addSubject() {
    const trimmed = subjectDraft.trim();
    if (trimmed && !subjects.includes(trimmed)) setSubjects((s) => [...s, trimmed]);
    setSubjectDraft('');
  }

  async function finish() {
    setFinishing(true);
    try {
      await updateProfileAndFinish();
    } finally {
      setFinishing(false);
    }
  }

  async function updateProfileAndFinish() {
    localStorage.setItem('stubby_subjects', JSON.stringify(subjects));
    localStorage.setItem('stubby_default_minutes', String(dailyGoal));
    await AuthApi.update({ name, grade, studyWindowStart: wakeTime, studyWindowEnd: sleepTime, onboarded: true });
    updateUser({ name, grade, studyWindowStart: wakeTime, studyWindowEnd: sleepTime, onboarded: true });
    try {
      if (tests.length > 0) {
        await SessionsApi.generate(todayStr());
        push("Stubby planned today's first study session!", 'success');
      }
    } catch {
      // Non-fatal — dashboard will offer to plan the day if this didn't produce one.
    }
    navigate('/');
  }

  return (
    <div className="min-h-dvh bg-gradient-to-b from-brand-50 to-ink-50 flex flex-col items-center px-5 py-8">
      <div className="mb-6">
        <Logo size={34} />
      </div>

      <div className="w-full max-w-md">
        <StepDots current={step} />

        <Card className="mt-5">
          {step === 0 && (
            <StepBlock title="Let's set you up" subtitle="A few quick things and Stubby takes it from there.">
              <div className="flex flex-col gap-4">
                <div>
                  <FieldLabel>What's your name?</FieldLabel>
                  <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex" />
                </div>
                <div>
                  <FieldLabel>What grade are you in?</FieldLabel>
                  <Select value={grade} onChange={(e) => setGrade(e.target.value)}>
                    {['6', '7', '8', '9', '10', '11', '12'].map((g) => (
                      <option key={g} value={g}>
                        Grade {g}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <FieldLabel>What subjects do you have?</FieldLabel>
                  <div className="flex gap-2">
                    <TextInput
                      value={subjectDraft}
                      onChange={(e) => setSubjectDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addSubject();
                        }
                      }}
                      placeholder="History"
                    />
                    <Button type="button" variant="secondary" onClick={addSubject}>
                      Add
                    </Button>
                  </div>
                  {subjects.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {subjects.map((s) => (
                        <span key={s} className="rounded-full bg-brand-50 text-brand-700 text-xs font-semibold px-2.5 py-1">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <NextButton onClick={() => setStep(1)} disabled={!name.trim()} />
            </StepBlock>
          )}

          {step === 1 && (
            <StepBlock title="What's your normal schedule?" subtitle="School, sports, work — anything that takes up time.">
              <div className="flex flex-col gap-2">
                {events.map((ev) => (
                  <div key={ev.id} className="flex items-center justify-between rounded-xl bg-ink-50 px-3 py-2.5">
                    <div>
                      <p className="text-sm font-semibold text-ink-800">{ev.name}</p>
                      <p className="text-xs text-ink-500">
                        {ev.recurrence === 'weekly'
                          ? ev.daysOfWeek.map((d) => WEEKDAY_LABELS[d]).join(', ')
                          : ev.recurrence === 'daily'
                          ? 'Every day'
                          : friendlyDayLabel(ev.date!)}{' '}
                        · {formatTime12h(ev.startTime)}–{formatTime12h(ev.endTime)}
                      </p>
                    </div>
                    <CategoryBadge category={ev.category} />
                  </div>
                ))}
                {showEventForm ? (
                  <div className="pt-2">
                    <EventForm onSubmit={handleAddEvent} onCancel={() => setShowEventForm(false)} />
                  </div>
                ) : (
                  <Button type="button" variant="secondary" onClick={() => setShowEventForm(true)} className="mt-1">
                    <Plus size={16} /> Add a commitment
                  </Button>
                )}
              </div>
              {!showEventForm && <NextButton onClick={() => setStep(2)} secondaryLabel={events.length === 0 ? 'Skip for now' : undefined} />}
            </StepBlock>
          )}

          {step === 2 && (
            <StepBlock title="Any upcoming tests?" subtitle="Stubby prioritizes what's due soonest and hardest.">
              <div className="flex flex-col gap-2">
                {tests.map((t) => (
                  <div key={t.id} className="flex items-center justify-between rounded-xl bg-ink-50 px-3 py-2.5">
                    <div>
                      <p className="text-sm font-semibold text-ink-800">
                        {t.subject} — {t.name}
                      </p>
                      <p className="text-xs text-ink-500">
                        {friendlyDayLabel(t.date)} · {t.difficulty} · {t.dailyStudyMinutes} min/day
                      </p>
                    </div>
                  </div>
                ))}
                {showTestForm ? (
                  <div className="pt-2">
                    <TestForm defaultMinutes={dailyGoal} onSubmit={handleAddTest} onCancel={() => setShowTestForm(false)} />
                  </div>
                ) : (
                  <Button type="button" variant="secondary" onClick={() => setShowTestForm(true)} className="mt-1">
                    <Plus size={16} /> Add a test or assignment
                  </Button>
                )}
              </div>
              {!showTestForm && <NextButton onClick={() => setStep(3)} secondaryLabel={tests.length === 0 ? 'Skip for now' : undefined} />}
            </StepBlock>
          )}

          {step === 3 && (
            <StepBlock title="How much do you want to study each day?" subtitle="Stubby will default new tests to this — you can change it per test.">
              <div className="flex flex-col gap-5">
                <div>
                  <FieldLabel>Default daily study goal: {dailyGoal} min</FieldLabel>
                  <input
                    type="range"
                    min={15}
                    max={120}
                    step={15}
                    value={dailyGoal}
                    onChange={(e) => setDailyGoal(Number(e.target.value))}
                    className="w-full accent-brand-600"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FieldLabel>Usually awake by</FieldLabel>
                    <TextInput type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} />
                  </div>
                  <div>
                    <FieldLabel>Usually asleep by</FieldLabel>
                    <TextInput type="time" value={sleepTime} onChange={(e) => setSleepTime(e.target.value)} />
                  </div>
                </div>
                <p className="text-xs text-ink-400">Stubby only schedules study sessions inside this window, and never during something already on your schedule.</p>
              </div>
              <NextButton onClick={() => setStep(4)} />
            </StepBlock>
          )}

          {step === 4 && (
            <div className="flex flex-col items-center text-center gap-4 py-4">
              <PartyPopper className="text-accent-500" size={40} />
              <div>
                <h2 className="font-display text-xl font-extrabold text-ink-900">You're all set.</h2>
                <p className="text-ink-500 mt-1">Stubby will handle the planning.</p>
              </div>
              <ul className="text-left w-full flex flex-col gap-2 mt-2">
                <SummaryRow ok label={`${events.length} schedule commitment${events.length === 1 ? '' : 's'} added`} />
                <SummaryRow ok label={`${tests.length} test${tests.length === 1 ? '' : 's'} added`} />
                <SummaryRow ok label={`${dailyGoal} min/day default study goal`} />
              </ul>
              <Button size="lg" fullWidth onClick={finish} disabled={finishing} className="mt-2">
                {finishing ? 'Setting up…' : 'Take me to Stubby'}
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function StepBlock({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-display text-xl font-extrabold text-ink-900">{title}</h2>
      <p className="text-sm text-ink-500 mt-1 mb-5">{subtitle}</p>
      {children}
    </div>
  );
}

function NextButton({ onClick, disabled, secondaryLabel }: { onClick: () => void; disabled?: boolean; secondaryLabel?: string }) {
  return (
    <Button type="button" size="lg" fullWidth onClick={onClick} disabled={disabled} className="mt-5">
      {secondaryLabel && !disabled ? secondaryLabel : 'Continue'}
    </Button>
  );
}

function SummaryRow({ label, ok }: { label: string; ok?: boolean }) {
  return (
    <li className="flex items-center gap-2 text-sm text-ink-600">
      <CheckCircle2 size={16} className={ok ? 'text-mint-500' : 'text-ink-300'} />
      {label}
    </li>
  );
}

function StepDots({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {STEPS.map((s, idx) => (
        <div
          key={s}
          className={`h-1.5 rounded-full transition-all ${idx === current ? 'w-6 bg-brand-600' : idx < current ? 'w-1.5 bg-brand-300' : 'w-1.5 bg-ink-200'}`}
        />
      ))}
    </div>
  );
}
