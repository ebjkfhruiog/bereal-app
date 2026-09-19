import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { Flame, Lock, Sparkles, Trophy } from 'lucide-react';
import { ScreenHeader } from '../components/NavShell';
import { Button, Card, Spinner } from '../components/ui';
import { StatsApi } from '../lib/resources';
import type { Stats } from '../lib/types';
import { useAuth } from '../store/AuthContext';

const SUBJECT_COLORS = ['#5B4FE9', '#FF7A50', '#22C58B', '#F5A623', '#4A90D9', '#E1548D'];

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export default function StatsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    StatsApi.get()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (!user?.isPremium) return <StatsLocked preview={stats} />;

  if (loading || !stats) {
    return (
      <div className="flex justify-center py-20 text-brand-600">
        <Spinner />
      </div>
    );
  }

  const chartData = stats.dailyHistory.map((d) => ({
    label: new Date(d.date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short' }),
    minutes: d.minutes,
  }));

  return (
    <div className="flex flex-col gap-6 animate-fade-up">
      <ScreenHeader title="Stats" subtitle="Your study track record" />

      <Card className="bg-gradient-to-br from-brand-600 to-brand-700 text-white border-none">
        <p className="text-brand-100 text-xs font-bold tracking-widest uppercase">This Week</p>
        <p className="font-display text-4xl font-extrabold mt-1">{formatDuration(stats.weekMinutes)}</p>
        <div className="flex items-center gap-4 mt-3 text-sm font-semibold text-brand-100">
          <span>{stats.sessionsCompleted} sessions total</span>
          <span className="flex items-center gap-1">
            <Flame size={15} className="text-accent-400" /> {stats.currentStreak} day streak
          </span>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <StatTile label="Total time" value={formatDuration(stats.totalMinutes)} />
        <StatTile label="This month" value={formatDuration(stats.monthMinutes)} />
        <StatTile label="Longest streak" value={`${stats.longestStreak} days`} icon={<Trophy size={14} className="text-accent-500" />} />
        <StatTile label="Sessions" value={String(stats.sessionsCompleted)} />
      </div>

      <Card>
        <p className="font-display font-bold text-ink-800 mb-3">Last 14 Days</p>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#eeeef5" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} interval={1} stroke="#8e8ea3" />
              <Tooltip
                cursor={{ fill: '#f1efff' }}
                formatter={(value) => [`${value} min`, 'Studied']}
                contentStyle={{ borderRadius: 12, border: '1px solid #eeeef5', fontSize: 12 }}
              />
              <Bar dataKey="minutes" radius={[6, 6, 6, 6]} fill="#5B4FE9" maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <p className="font-display font-bold text-ink-800 mb-3">By Subject</p>
        {stats.bySubject.length === 0 ? (
          <p className="text-sm text-ink-400 py-6 text-center">Complete a session to see this fill in.</p>
        ) : (
          <div className="flex items-center gap-4">
            <div className="h-32 w-32 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.bySubject} dataKey="minutes" nameKey="subject" innerRadius={32} outerRadius={56} paddingAngle={2}>
                    {stats.bySubject.map((_, i) => (
                      <Cell key={i} fill={SUBJECT_COLORS[i % SUBJECT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} min`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 flex flex-col gap-1.5 min-w-0">
              {stats.bySubject.map((s, i) => (
                <div key={s.subject} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: SUBJECT_COLORS[i % SUBJECT_COLORS.length] }} />
                    <span className="truncate font-medium text-ink-700">{s.subject}</span>
                  </span>
                  <span className="text-ink-400 shrink-0 ml-2">{formatDuration(s.minutes)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function StatTile({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide">{label}</p>
      <p className="font-display text-xl font-extrabold text-ink-900 mt-1 flex items-center gap-1.5">
        {icon}
        {value}
      </p>
    </Card>
  );
}

function StatsLocked({ preview }: { preview: Stats | null }) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col gap-6 animate-fade-up">
      <ScreenHeader title="Stats" subtitle="Your study track record" />

      <Card className="relative overflow-hidden min-h-[300px]">
        <div className="blur-sm pointer-events-none select-none opacity-60">
          <p className="text-xs font-bold tracking-widest uppercase text-ink-400">This Week</p>
          <p className="font-display text-4xl font-extrabold mt-1">{preview ? formatDuration(preview.weekMinutes) : '2h 45m'}</p>
          <div className="flex items-center gap-4 mt-3 text-sm font-semibold text-ink-500">
            <span>{preview?.sessionsCompleted ?? 6} sessions total</span>
            <span>🔥 {preview?.currentStreak ?? 4} day streak</span>
          </div>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/80 px-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center">
            <Lock size={20} />
          </div>
          <p className="font-display font-bold text-ink-900">Stats are a Stubby+ feature</p>
          <p className="text-sm text-ink-500 text-center max-w-xs px-4">Unlock streaks, weekly trends, and subject breakdowns for $5, once, forever.</p>
          <Button variant="accent" onClick={() => navigate('/upgrade')}>
            <Sparkles size={16} /> Get Stubby+
          </Button>
        </div>
      </Card>
    </div>
  );
}
