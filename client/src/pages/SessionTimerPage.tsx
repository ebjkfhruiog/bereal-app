import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Pause, Play, Square, X } from 'lucide-react';
import { Button, Spinner } from '../components/ui';
import { LogoMark } from '../components/Logo';
import { SessionsApi } from '../lib/resources';
import type { StudySession } from '../lib/types';
import { useToastStore } from '../store/toast';

function formatClock(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function SessionTimerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const push = useToastStore((s) => s.push);

  const [session, setSession] = useState<StudySession | null>(null);
  const [loading, setLoading] = useState(true);
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState<'ready' | 'running' | 'paused' | 'done'>('ready');
  const [saving, setSaving] = useState(false);
  const totalSecondsRef = useRef(0);
  const elapsedRef = useRef(0);

  useEffect(() => {
    if (!id) return;
    SessionsApi.get(id)
      .then(({ session }) => {
        setSession(session);
        const total = session.durationMinutes * 60;
        totalSecondsRef.current = total;
        setRemaining(total);
      })
      .catch(() => push('Could not load that session.', 'error'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(interval);
          setRunning(false);
          setStatus('done');
          elapsedRef.current = totalSecondsRef.current;
          return 0;
        }
        elapsedRef.current += 1;
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [running]);

  const finishSession = useCallback(
    async (elapsedSeconds: number) => {
      if (!session) return;
      setSaving(true);
      try {
        await SessionsApi.complete(session.id, elapsedSeconds);
        setStatus('done');
        setRunning(false);
      } catch {
        push('Could not save this session, but great work studying.', 'error');
      } finally {
        setSaving(false);
      }
    },
    [session, push]
  );

  useEffect(() => {
    if (status === 'done' && remaining === 0 && session) {
      finishSession(elapsedRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, remaining]);

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-ink-900">
        <Spinner className="text-white" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-4 bg-ink-900 text-white px-6 text-center">
        <p>This session couldn't be found.</p>
        <Button onClick={() => navigate('/')}>Back to dashboard</Button>
      </div>
    );
  }

  const progress = 1 - remaining / (totalSecondsRef.current || 1);

  return (
    <div className="min-h-dvh bg-ink-900 text-white flex flex-col">
      <div className="flex items-center justify-between px-5 pt-6">
        <LogoMark size={28} />
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10" aria-label="Close">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {status !== 'done' ? (
          <>
            <p className="text-brand-300 text-xs font-bold tracking-widest uppercase mb-2">Study Session</p>
            <p className="font-display text-3xl font-extrabold mb-8">{session.subject}</p>

            <TimerRing progress={progress} label={formatClock(remaining)} />

            <div className="flex items-center gap-4 mt-10">
              {status === 'ready' && (
                <Button size="lg" className="px-10" onClick={() => { setRunning(true); setStatus('running'); }}>
                  <Play size={18} fill="currentColor" /> Start
                </Button>
              )}
              {status === 'running' && (
                <Button size="lg" variant="secondary" className="bg-white/10 text-white hover:bg-white/20 px-10" onClick={() => { setRunning(false); setStatus('paused'); }}>
                  <Pause size={18} /> Pause
                </Button>
              )}
              {status === 'paused' && (
                <Button size="lg" className="px-10" onClick={() => { setRunning(true); setStatus('running'); }}>
                  <Play size={18} fill="currentColor" /> Resume
                </Button>
              )}
              {status !== 'ready' && (
                <Button
                  size="lg"
                  variant="accent"
                  onClick={() => finishSession(elapsedRef.current)}
                  disabled={saving}
                  aria-label="Finish early"
                >
                  <Square size={16} fill="currentColor" /> Finish
                </Button>
              )}
            </div>
            {status === 'paused' && <p className="text-ink-400 text-sm mt-4">Paused — Stubby's still counting on you.</p>}
          </>
        ) : (
          <CompletionCelebration session={session} onDone={() => navigate('/')} />
        )}
      </div>
    </div>
  );
}

function TimerRing({ progress, label }: { progress: number; label: string }) {
  const size = 260;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(1, Math.max(0, progress)));

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(255,255,255,0.1)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#FF7A50"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-display text-5xl font-extrabold tabular-nums">{label}</span>
      </div>
    </div>
  );
}

function CompletionCelebration({ session, onDone }: { session: StudySession; onDone: () => void }) {
  return (
    <div className="flex flex-col items-center text-center gap-3 animate-pop">
      <div className="text-6xl">🎉</div>
      <h1 className="font-display text-2xl font-extrabold">Study session complete!</h1>
      <p className="text-ink-300">
        {session.durationMinutes} minutes of {session.subject}, in the books.
      </p>
      <Button size="lg" onClick={onDone} className="mt-4 px-10">
        Nice. Back to dashboard
      </Button>
    </div>
  );
}
