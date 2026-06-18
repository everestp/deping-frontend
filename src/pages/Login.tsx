import { AlertCircle, Eye, EyeOff, Lock, Mail, Zap } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Common/Button';
import { Card } from '../components/Common/Card';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  // Access doLogin from context (which comes from your auth-api hook)
  const { doLogin } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('demo@deping.xyz');
  const [password, setPassword] = useState('demo1234');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!email.trim()) { setError('Email is required.'); return; }
    if (!password.trim()) { setError('Password is required.'); return; }

    setLoading(true);

    try {
      // FIX: Use doLogin and pass a LoginPayload object { email, password }
      await doLogin({ email, password });
      navigate('/dashboard');
    } catch (e: any) {
      // The hook in auth-api.ts throws the error, so we catch it here
      setError(e.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Zap className="w-6 h-6 text-sky-400" />
              <span className="font-mono-data font-bold text-lg text-[var(--text-primary)] tracking-tight">
            deping.xyz
          </span>
          </div>
          <h1 className="font-mono-data text-2xl font-semibold text-[var(--text-primary)]">
            Operator sign in
          </h1>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-lg bg-red-500/10 border border-red-500/25 text-red-400 text-sm animate-fade-in-up">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-white/5 border border-[var(--border-subtle)] rounded-lg py-2.5 pl-10 pr-4 text-sm text-[var(--text-primary)] outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-[var(--border-subtle)] rounded-lg py-2.5 pl-10 pr-10 text-sm text-[var(--text-primary)] outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" size="md" loading={loading}>
              {loading ? 'Authenticating...' : 'Sign in to dashboard'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
