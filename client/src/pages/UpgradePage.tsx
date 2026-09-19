import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Check, Flame, TrendingUp, X, Zap } from 'lucide-react';
import { LogoMark } from '../components/Logo';
import { Button } from '../components/ui';
import { PremiumApi } from '../lib/resources';
import { useAuth } from '../store/AuthContext';
import { useToastStore } from '../store/toast';

const FEATURES = [
  { icon: X, label: 'Remove ads' },
  { icon: BarChart3, label: 'Unlock study statistics' },
  { icon: Flame, label: 'Track your streak' },
  { icon: TrendingUp, label: 'See weekly & monthly progress' },
  { icon: Zap, label: 'Subject-by-subject study time' },
];

export default function UpgradePage() {
  const navigate = useNavigate();
  const { updateUser, user } = useAuth();
  const push = useToastStore((s) => s.push);
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    setLoading(true);
    try {
      const { user } = await PremiumApi.upgrade();
      updateUser(user);
      push('Welcome to Stubby+ 🎉', 'success');
      navigate(-1);
    } catch {
      push('Could not complete purchase. Try again.', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-gradient-to-b from-ink-900 to-ink-800 text-white flex flex-col">
      <div className="flex items-center justify-between px-5 pt-6">
        <LogoMark size={28} />
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10" aria-label="Close">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center px-6 pt-8 pb-10 max-w-sm mx-auto w-full">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-pop mb-5">
          <Zap size={28} fill="white" />
        </div>
        <h1 className="font-display text-3xl font-extrabold">Stubby+</h1>
        <p className="text-ink-300 text-center mt-2">Study smarter. See your progress.</p>

        {user?.isPremium ? (
          <div className="mt-8 rounded-2xl bg-white/10 px-5 py-4 text-center">
            <p className="font-semibold">You're already on Stubby+ 🎉</p>
          </div>
        ) : (
          <>
            <div className="w-full flex flex-col gap-3 mt-8">
              {FEATURES.map((f) => (
                <div key={f.label} className="flex items-center gap-3 bg-white/5 rounded-2xl px-4 py-3">
                  <div className="w-7 h-7 rounded-full bg-mint-500/20 text-mint-500 flex items-center justify-center shrink-0">
                    <Check size={15} strokeWidth={3} />
                  </div>
                  <span className="text-sm font-medium text-ink-100">{f.label}</span>
                </div>
              ))}
            </div>

            <div className="mt-9 text-center">
              <p className="font-display text-5xl font-extrabold">$5</p>
              <p className="text-ink-400 text-sm mt-1">One-time payment. Lifetime access.</p>
            </div>

            <Button variant="accent" size="lg" fullWidth className="mt-7" onClick={handleUpgrade} disabled={loading}>
              {loading ? 'Processing…' : 'Get Stubby+'}
            </Button>
            <p className="text-[11px] text-ink-500 text-center mt-3 max-w-xs">
              Demo checkout — flips your account to Stubby+ instantly. Swap in Stripe Checkout for real payments (see server/routes/premium.js).
            </p>
          </>
        )}
      </div>
    </div>
  );
}
