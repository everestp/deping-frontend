import { AlertCircle, CheckCircle, Eye, EyeOff, Lock, Mail, User, Wallet, Zap } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../api/auth-api';
import { Button } from '../components/Common/Button';
import { Card } from '../components/Common/Card';

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: '8+ characters', ok: password.length >= 8 },
    { label: 'Uppercase letter', ok: /[A-Z]/.test(password) },
    { label: 'Number', ok: /\d/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const colors = ['bg-red-500', 'bg-amber-500', 'bg-sky-500', 'bg-emerald-500'];
  const labels = ['', 'Weak', 'Fair', 'Strong'];

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${i < score ? colors[score] : 'bg-white/10'}`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--text-muted)]">{labels[score]}</span>
        <div className="flex gap-2">
          {checks.map((c) => (
            <span key={c.label} className={`text-[10px] font-mono-data ${c.ok ? 'text-emerald-400' : 'text-[var(--text-muted)]'}`}>
              {c.ok && <CheckCircle className="w-3 h-3 inline mr-0.5" />}
              {c.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Signup() {
  const { doRegister } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', username: '', password: '', confirm: '', publicKey: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, [field]: e.target.value }));
  }

async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!form.email.trim()) { setError('Email is required.'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }

    setLoading(true);

    try {
      // 3. Map your form state to the RegisterPayload interface
      // Note: your API client didn't have 'username' in RegisterPayload,
      // add it to the interface in lib/auth-api.ts if needed.
      await doRegister({
        email: form.email,
        password: form.password,
        wallet_pubkey: form.publicKey
      });

      navigate('/dashboard');
    } catch (e) {
      setError((e as Error).message || 'Registration failed.');
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
            <span className="font-mono-data text-xl font-bold text-gradient-brand">deping.xyz</span>
          </div>
          <h1 className="font-mono-data text-2xl font-semibold text-[var(--text-primary)]">
            Create operator account
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Start monitoring and earning $UPT rewards
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-lg bg-red-500/10 border border-red-500/25 text-red-400 text-sm animate-fade-in-up">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={update('email')}
                    placeholder="you@example.com"
                    className="w-full bg-white/5 border border-[var(--border-subtle)] hover:border-sky-500/30 focus:border-sky-500/60 rounded-lg py-2.5 pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    value={form.username}
                    onChange={update('username')}
                    placeholder="operator_handle"
                    className="w-full bg-white/5 border border-[var(--border-subtle)] hover:border-sky-500/30 focus:border-sky-500/60 rounded-lg py-2.5 pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-colors"
                  />
                </div>
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
                  value={form.password}
                  onChange={update('password')}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-[var(--border-subtle)] hover:border-sky-500/30 focus:border-sky-500/60 rounded-lg py-2.5 pl-10 pr-10 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <PasswordStrength password={form.password} />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="password"
                  value={form.confirm}
                  onChange={update('confirm')}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-[var(--border-subtle)] hover:border-sky-500/30 focus:border-sky-500/60 rounded-lg py-2.5 pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
                Solana Wallet Public Key{' '}
                <span className="text-[var(--text-muted)] normal-case font-normal">(optional)</span>
              </label>
              <div className="relative">
                <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="text"
                  value={form.publicKey}
                  onChange={update('publicKey')}
                  placeholder="6xR4mKpJfBq... (Phantom wallet address)"
                  className="w-full bg-white/5 border border-[var(--border-subtle)] hover:border-sky-500/30 focus:border-sky-500/60 rounded-lg py-2.5 pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-colors font-mono-data"
                />
              </div>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Link your Solana address to receive $UPT reward settlements
              </p>
            </div>

            <Button type="submit" className="w-full" size="md" loading={loading}>
              {loading ? 'Creating account...' : 'Create account'}
            </Button>

            <p className="text-center text-sm text-[var(--text-muted)]">
              Already have an account?{' '}
              <Link to="/login" className="text-sky-400 hover:text-sky-300 transition-colors">
                Sign in
              </Link>
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
}
