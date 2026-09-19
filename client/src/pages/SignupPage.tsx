import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui';
import { ApiError } from '../lib/api';
import { useAuth } from '../store/AuthContext';
import { AuthShell } from './LoginPage';

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signup({ name, email, password });
      navigate('/onboarding');
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
          <label className="text-sm font-semibold text-ink-600 mb-1.5 block">Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-2xl border border-ink-200 px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            placeholder="Alex Chen"
          />
        </div>
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
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-2xl border border-ink-200 px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            placeholder="At least 6 characters"
          />
        </div>
        {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
        <Button type="submit" size="lg" fullWidth disabled={loading}>
          {loading ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
      <p className="text-center text-sm text-ink-500 mt-6">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-brand-600">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
