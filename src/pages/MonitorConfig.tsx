import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Globe,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Filter,
} from 'lucide-react';
import { Card } from '../components/Common/Card';
import { Button } from '../components/Common/Button';

type HttpMethod = 'GET' | 'HEAD' | 'POST';
type Region = 'US-East' | 'EU-Central' | 'AP-South' | 'US-West' | 'SA-East';
type IntervalSeconds = 30 | 60 | 120 | 300;
type ExpectedStatus = 200 | 201 | 204 | 301 | 302;

interface MonitorTarget {
  id: string;
  url: string;
  method: HttpMethod;
  expectedStatus: ExpectedStatus;
  regions: Region[];
  interval: IntervalSeconds;
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  lastChecked: string;
  avgLatency: number;
  uptime: string;
  deletedAt: string | null;
}

const INITIAL_TARGETS: MonitorTarget[] = [
  {
    id: 'tgt_001',
    url: 'https://api.deping.xyz',
    method: 'GET',
    expectedStatus: 200,
    regions: ['US-East', 'EU-Central', 'AP-South'],
    interval: 30,
    name: 'deping API Gateway',
    status: 'healthy',
    lastChecked: '18:14:47 UTC',
    avgLatency: 38,
    uptime: '99.98%',
    deletedAt: null,
  },
  {
    id: 'tgt_002',
    url: 'https://solana.com',
    method: 'GET',
    expectedStatus: 200,
    regions: ['US-East', 'EU-Central'],
    interval: 60,
    name: 'Solana Homepage',
    status: 'healthy',
    lastChecked: '18:14:49 UTC',
    avgLatency: 55,
    uptime: '99.91%',
    deletedAt: null,
  },
  {
    id: 'tgt_003',
    url: 'https://status.solana.com',
    method: 'HEAD',
    expectedStatus: 200,
    regions: ['US-East'],
    interval: 120,
    name: 'Solana Status Page',
    status: 'degraded',
    lastChecked: '18:14:50 UTC',
    avgLatency: 112,
    uptime: '98.74%',
    deletedAt: null,
  },
  {
    id: 'tgt_004',
    url: 'https://api.coingecko.com/api/v3/ping',
    method: 'GET',
    expectedStatus: 200,
    regions: ['EU-Central', 'AP-South'],
    interval: 60,
    name: 'CoinGecko Ping',
    status: 'healthy',
    lastChecked: '18:14:52 UTC',
    avgLatency: 74,
    uptime: '99.55%',
    deletedAt: null,
  },
  {
    id: 'tgt_005',
    url: 'https://mainnet.helius-rpc.com',
    method: 'POST',
    expectedStatus: 200,
    regions: ['US-East', 'AP-South'],
    interval: 30,
    name: 'Helius RPC Endpoint',
    status: 'healthy',
    lastChecked: '18:14:55 UTC',
    avgLatency: 29,
    uptime: '99.97%',
    deletedAt: null,
  },
];

const ALL_REGIONS: Region[] = ['US-East', 'EU-Central', 'AP-South', 'US-West', 'SA-East'];

const STATUS_CONFIG = {
  healthy: { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/25', dot: 'bg-emerald-400', label: 'Healthy' },
  degraded: { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/25', dot: 'bg-amber-400', label: 'Degraded' },
  down: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/25', dot: 'bg-red-400', label: 'Down' },
};

interface FormState {
  name: string;
  url: string;
  method: HttpMethod;
  expectedStatus: ExpectedStatus;
  regions: Region[];
  interval: IntervalSeconds;
}

const DEFAULT_FORM: FormState = {
  name: '',
  url: '',
  method: 'GET',
  expectedStatus: 200,
  regions: ['US-East'],
  interval: 60,
};

export default function MonitorConfig() {
  const [targets, setTargets] = useState<MonitorTarget[]>(INITIAL_TARGETS);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'healthy' | 'degraded' | 'down'>('all');

  function updateForm<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm((p) => ({ ...p, [key]: val }));
    setFormErrors((p) => ({ ...p, [key]: undefined }));
  }

  function toggleRegion(r: Region) {
    setForm((p) => {
      const has = p.regions.includes(r);
      return { ...p, regions: has ? p.regions.filter((x) => x !== r) : [...p.regions, r] };
    });
  }

  function validateForm(): boolean {
    const errors: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) errors.name = 'Target name is required.';
    if (!form.url.trim()) {
      errors.url = 'URL is required.';
    } else {
      try { new URL(form.url); } catch { errors.url = 'Enter a valid URL (include https://).'; }
    }
    if (form.regions.length === 0) errors.regions = 'Select at least one region.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleAddTarget(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));

    const newTarget: MonitorTarget = {
      id: `tgt_${Math.random().toString(36).slice(2, 7)}`,
      ...form,
      status: 'healthy',
      lastChecked: 'Just now',
      avgLatency: Math.floor(Math.random() * 80) + 20,
      uptime: '100.00%',
      deletedAt: null,
    };

    setTargets((p) => [...p, newTarget]);
    setForm(DEFAULT_FORM);
    setShowForm(false);
    setSubmitting(false);
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    // Simulate DELETE /api/websites/{id}
    await new Promise((r) => setTimeout(r, 700));
    setTargets((p) =>
      p.map((t) =>
        t.id === id ? { ...t, deletedAt: new Date().toISOString() } : t
      )
    );
    setDeletingId(null);
  }

  const visible = targets.filter(
    (t) => t.deletedAt === null && (filterStatus === 'all' || t.status === filterStatus)
  );

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-mono-data text-xl font-semibold text-[var(--text-primary)]">
            Monitor Configuration
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            {visible.length} active target{visible.length !== 1 ? 's' : ''} across all regions
          </p>
        </div>
        <Button size="sm" onClick={() => setShowForm((p) => !p)}>
          <Plus className="w-3.5 h-3.5" />
          Add Website Monitor
        </Button>
      </div>

      {/* Add form */}
      {showForm && (
        <Card className="animate-fade-in-up border-sky-500/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <Plus className="w-4 h-4 text-sky-400" />
              New Monitor Target
            </h2>
            <button
              onClick={() => { setShowForm(false); setForm(DEFAULT_FORM); setFormErrors({}); }}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors text-sm"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleAddTarget} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
                  Display Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateForm('name', e.target.value)}
                  placeholder="My API Endpoint"
                  className="w-full bg-white/5 border border-[var(--border-subtle)] hover:border-sky-500/30 focus:border-sky-500/60 rounded-lg py-2.5 px-4 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-colors"
                />
                {formErrors.name && (
                  <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {formErrors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
                  Target URL
                </label>
                <input
                  type="url"
                  value={form.url}
                  onChange={(e) => updateForm('url', e.target.value)}
                  placeholder="https://api.example.com/health"
                  className="w-full bg-white/5 border border-[var(--border-subtle)] hover:border-sky-500/30 focus:border-sky-500/60 rounded-lg py-2.5 px-4 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-colors font-mono-data"
                />
                {formErrors.url && (
                  <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {formErrors.url}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
                  HTTP Method
                </label>
                <select
                  value={form.method}
                  onChange={(e) => updateForm('method', e.target.value as HttpMethod)}
                  className="w-full bg-white/5 border border-[var(--border-subtle)] hover:border-sky-500/30 focus:border-sky-500/60 rounded-lg py-2.5 px-4 text-sm text-[var(--text-primary)] outline-none transition-colors appearance-none font-mono-data"
                >
                  {(['GET', 'HEAD', 'POST'] as HttpMethod[]).map((m) => (
                    <option key={m} value={m} className="bg-slate-900">{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
                  Expected Status
                </label>
                <select
                  value={form.expectedStatus}
                  onChange={(e) => updateForm('expectedStatus', parseInt(e.target.value) as ExpectedStatus)}
                  className="w-full bg-white/5 border border-[var(--border-subtle)] hover:border-sky-500/30 focus:border-sky-500/60 rounded-lg py-2.5 px-4 text-sm text-[var(--text-primary)] outline-none transition-colors appearance-none font-mono-data"
                >
                  {([200, 201, 204, 301, 302] as ExpectedStatus[]).map((s) => (
                    <option key={s} value={s} className="bg-slate-900">HTTP {s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
                  Check Interval
                </label>
                <select
                  value={form.interval}
                  onChange={(e) => updateForm('interval', parseInt(e.target.value) as IntervalSeconds)}
                  className="w-full bg-white/5 border border-[var(--border-subtle)] hover:border-sky-500/30 focus:border-sky-500/60 rounded-lg py-2.5 px-4 text-sm text-[var(--text-primary)] outline-none transition-colors appearance-none font-mono-data"
                >
                  {([30, 60, 120, 300] as IntervalSeconds[]).map((s) => (
                    <option key={s} value={s} className="bg-slate-900">Every {s}s</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2 uppercase tracking-wider">
                Monitoring Regions
              </label>
              <div className="flex flex-wrap gap-2">
                {ALL_REGIONS.map((r) => (
                  <button
                    type="button"
                    key={r}
                    onClick={() => toggleRegion(r)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono-data border transition-all ${
                      form.regions.includes(r)
                        ? 'bg-sky-500/15 border-sky-500/50 text-sky-400'
                        : 'bg-white/3 border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-sky-500/25'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              {formErrors.regions && (
                <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {formErrors.regions}
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-1">
              <Button type="submit" loading={submitting}>
                {submitting ? 'Adding target...' : 'Add Monitor Target'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => { setShowForm(false); setForm(DEFAULT_FORM); setFormErrors({}); }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="w-3.5 h-3.5 text-[var(--text-muted)]" />
        <div className="flex gap-1">
          {(['all', 'healthy', 'degraded', 'down'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilterStatus(f)}
              className={`px-3 py-1 text-xs rounded-lg font-mono-data transition-all capitalize ${
                filterStatus === f
                  ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-white/5'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Target cards */}
      <div className="space-y-3">
        {visible.length === 0 && (
          <Card className="text-center py-10">
            <Globe className="w-8 h-8 mx-auto mb-3 text-[var(--text-muted)] opacity-40" />
            <p className="text-[var(--text-muted)] text-sm">No targets match the current filter.</p>
          </Card>
        )}

        {visible.map((target) => {
          const sc = STATUS_CONFIG[target.status];
          const isDeleting = deletingId === target.id;
          return (
            <Card
              key={target.id}
              className={`transition-all duration-300 ${isDeleting ? 'opacity-50 scale-[0.99]' : ''}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-1">
                    <span className={`w-2 h-2 rounded-full ${sc.dot} animate-pulse-dot block`} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-[var(--text-primary)]">{target.name}</span>
                      <span className={`text-[10px] font-mono-data px-1.5 py-0.5 rounded border ${sc.bg} ${sc.color}`}>
                        {sc.label}
                      </span>
                      <span className="text-[10px] font-mono-data px-1.5 py-0.5 rounded bg-white/5 text-[var(--text-muted)] border border-[var(--border-subtle)]">
                        {target.method}
                      </span>
                    </div>
                    <a
                      href={target.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-sky-400 font-mono-data hover:text-sky-300 transition-colors flex items-center gap-1 mt-0.5"
                    >
                      {target.url}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {target.regions.map((r) => (
                        <span key={r} className="text-[10px] font-mono-data px-1.5 py-0.5 rounded bg-sky-500/8 text-sky-400/80 border border-sky-500/15">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 shrink-0">
                  <div className="text-right">
                    <p className="font-mono-data text-sm font-semibold text-[var(--text-primary)]">
                      {target.avgLatency}ms
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">avg latency</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono-data text-sm font-semibold text-emerald-400">{target.uptime}</p>
                    <p className="text-xs text-[var(--text-muted)]">uptime</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="font-mono-data text-xs text-[var(--text-muted)] flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {target.lastChecked}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">every {target.interval}s</p>
                  </div>
                  <button
                    onClick={() => handleDelete(target.id)}
                    disabled={isDeleting}
                    className="p-2 rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/8 transition-all disabled:opacity-40"
                    title="Delete target"
                  >
                    {isDeleting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
