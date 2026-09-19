import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { Button } from '../components/ui';
import { ApiError } from '../lib/api';
import { useAuth } from '../store/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login({ email, password });
      navigate('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-sm font-semibold text-ink-600 mb-1.5 block">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-2xl border border-ink-200 px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            placeholder="you@school.edu"
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-ink-600 mb-1.5 block">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-2xl border border-ink-200 px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            placeholder="••••••••"
          />
        </div>
        {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
        <Button type="submit" size="lg" fullWidth disabled={loading}>
          {loading ? 'Signing in…' : 'Log in'}
        </Button>
      </form>
      <p className="text-center text-sm text-ink-500 mt-6">
        New to Stubby?{' '}
        <Link to="/signup" className="font-semibold text-brand-600">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-brand-50 to-ink-50 flex flex-col items-center justify-center px-5 py-10">
      <div className="mb-8 flex flex-col items-center gap-3">
        <Logo size={40} />
        <p className="text-ink-500 text-sm font-medium text-center max-w-xs">
          Stubby picks your study time. You just show up.
        </p>
      </div>
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-card p-6 border border-ink-100/60">{children}</div>
    </div>
  );
}
