import { Pause, Play, Plus, RefreshCw, Trash2, X, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createMonitor, deleteMonitor, fetchMonitors, toggleMonitorStatus } from '../api/monitor-api';
import { Button } from '../components/Common/Button';
import { Card } from '../components/Common/Card';

export default function MonitorConfig() {
  const [monitors, setMonitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ url: '', interval: 60 });

  const loadMonitors = async () => {
    try {
      const data = await fetchMonitors();
      setMonitors(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadMonitors(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createMonitor({ target_url: form.url, interval_seconds: form.interval });
      setForm({ url: '', interval: 60 });
      setShowForm(false);
      await loadMonitors();
    } catch (e) { alert("Failed to add monitor."); }
    finally { setIsSubmitting(false); }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    const previous = [...monitors];
    setMonitors(prev => prev.map(m => m.id === id ? { ...m, is_active: !isActive } : m));
    setActionLoading(id);
    try {
      await toggleMonitorStatus(id, isActive ? 'pause' : 'resume');
    } catch (e) {
      setMonitors(previous);
      alert("Status update failed");
    } finally { setActionLoading(null); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this monitor?')) return;
    const previous = [...monitors];
    setMonitors(prev => prev.filter(m => m.id !== id));
    try {
      await deleteMonitor(id);
    } catch (e) {
      setMonitors(previous);
      alert("Delete failed");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-mono-data text-xl font-semibold text-[var(--text-primary)] tracking-tight">Monitor Cockpit</h1>
          <p className="text-sm text-[var(--text-muted)]">Managed infrastructure endpoints</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)} className={showForm ? 'bg-zinc-800' : ''}>
          {showForm ? <X className="w-3.5 h-3.5 mr-2" /> : <Plus className="w-3.5 h-3.5 mr-2" />}
          {showForm ? 'Close' : 'Add New Target'}
        </Button>
      </div>

      {/* Animated Form */}
      <div className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${showForm ? 'max-h-40 opacity-100 mb-6' : 'max-h-0 opacity-0'}`}>
        <Card className="border-sky-500/20 bg-sky-500/5">
          <form onSubmit={handleAdd} className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1 block">Target URL</label>
              <input
                required type="url" value={form.url} onChange={e => setForm(p => ({...p, url: e.target.value}))}
                className="w-full bg-black/30 border border-[var(--border-subtle)] rounded-lg p-2.5 text-sm font-mono-data outline-none focus:border-sky-500 transition-colors"
                placeholder="https://api.dikkal.com"
              />
            </div>
            <div className="w-32">
              <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1 block">Interval (s)</label>
              <select
                value={form.interval} onChange={e => setForm(p => ({...p, interval: Number(e.target.value)}))}
                className="w-full bg-black/30 border border-[var(--border-subtle)] rounded-lg p-2.5 text-sm outline-none cursor-pointer"
              >
                {[30, 60, 120, 300].map(s => <option key={s} value={s}>{s}s</option>)}
              </select>
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Create'}
            </Button>
          </form>
        </Card>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-10 text-[var(--text-muted)] italic">Syncing monitors...</div>
      ) : (
        <div className="space-y-3">
          {monitors.map((m) => (
            <Card key={m.id} className={`group transition-all duration-300 border ${!m.is_active ? 'opacity-50 grayscale bg-black/10' : 'hover:border-sky-500/30'}`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-1.5 h-10 rounded-full ${m.is_active ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-amber-500'}`} />
                  <div>
                    <div className="font-semibold text-[var(--text-primary)]">{m.target_url}</div>
                    <div className="flex gap-4 text-xs text-[var(--text-muted)] mt-1 font-mono-data">
                      <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-sky-400"/> {m.credit_balance_checks.toLocaleString()}</span>
                      <span>Spent: <span className="text-[var(--text-primary)]">{m.total_spent_tokens}</span> tokens</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleToggle(m.id, m.is_active)} className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Toggle Status">
                    {actionLoading === m.id ? <RefreshCw className="animate-spin w-4 h-4" /> : (m.is_active ? <Pause className="w-4 h-4 text-amber-400"/> : <Play className="w-4 h-4 text-emerald-400"/>)}
                  </button>
                  <button onClick={() => handleDelete(m.id)} className="p-2 hover:text-red-400 transition-colors" title="Delete"><Trash2 className="w-4 h-4"/></button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
