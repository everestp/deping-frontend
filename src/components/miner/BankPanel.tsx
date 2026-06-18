// ─────────────────────────────────────────────
// components/miner/BankPanel.tsx
// ─────────────────────────────────────────────

import { AlertCircle, ArrowDownToLine, ArrowUpFromLine, CheckCircle, Database, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../Common/Button';

type Tab = 'deposit' | 'withdraw';

interface BankPanelProps {
  onChainBalance: number;
  walletBalance: number;
  onDeposit: (amount: number) => Promise<void>;
  onWithdraw: (amount: number) => Promise<void>;
}

export function BankPanel({ onChainBalance, walletBalance, onDeposit, onWithdraw }: BankPanelProps) {
  const [tab, setTab]             = useState<Tab>('deposit');
  const [amount, setAmount]       = useState('');
  const [processing, setProcessing] = useState(false);
  const [feedback, setFeedback]   = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  async function handleConfirm() {
    setFeedback(null);
    const val = parseFloat(amount);

    if (isNaN(val) || val <= 0) {
      setFeedback({ type: 'error', msg: 'Enter a valid positive amount.' });
      return;
    }
    if (tab === 'withdraw' && val > onChainBalance) {
      setFeedback({ type: 'error', msg: `Insufficient on-chain balance. Available: ${onChainBalance.toFixed(4)} $UPT` });
      return;
    }
    if (tab === 'deposit' && val > walletBalance) {
      setFeedback({ type: 'error', msg: `Wallet balance insufficient. Available: ${walletBalance.toFixed(4)} SOL` });
      return;
    }

    setProcessing(true);
    tab === 'deposit' ? await onDeposit(val) : await onWithdraw(val);
    setProcessing(false);
    setAmount('');
    setFeedback({
      type: 'success',
      msg: tab === 'deposit'
        ? `Deposited ${val.toFixed(4)} $UPT to escrow.`
        : `Withdrawal of ${val.toFixed(4)} $UPT initiated.`,
    });
    setTimeout(() => setFeedback(null), 4000);
  }

  const maxVal = tab === 'withdraw'
    ? onChainBalance.toFixed(4)
    : (walletBalance * 0.5).toFixed(4);

  return (
    <div className="glass rounded-2xl p-5" style={{ border: '1px solid var(--border-subtle)' }}>
      {/* Title */}
      <div className="flex items-center gap-2 mb-4">
        <Database className="w-4 h-4" style={{ color: 'var(--accent-blue)' }} />
        <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>On-Chain Bank</h2>
        <span
          className="ml-auto text-xs font-mono-data px-2 py-0.5 rounded"
          style={{ color: 'var(--accent-green)', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}
        >
          $UPT
        </span>
      </div>

      {/* Tabs */}
      <div
        className="flex rounded-lg p-0.5 mb-4"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)' }}
      >
        {(['deposit', 'withdraw'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setFeedback(null); setAmount(''); }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-mono-data font-medium transition-all capitalize"
            style={
              tab === t
                ? { background: 'rgba(56,189,248,0.15)', color: 'var(--accent-blue)', border: '1px solid rgba(56,189,248,0.3)' }
                : { color: 'var(--text-muted)', border: '1px solid transparent' }
            }
          >
            {t === 'deposit'
              ? <ArrowDownToLine className="w-3.5 h-3.5" />
              : <ArrowUpFromLine className="w-3.5 h-3.5" />}
            {t}
          </button>
        ))}
      </div>

      {/* Balances */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          { label: 'On-Chain Balance', value: onChainBalance.toFixed(4), unit: '$UPT', accent: 'var(--accent-blue)' },
          { label: 'Wallet Balance',   value: walletBalance.toFixed(4),  unit: 'SOL',  accent: 'var(--accent-green)' },
        ].map(({ label, value, unit, accent }) => (
          <div
            key={label}
            className="text-center px-3 py-2.5 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)' }}
          >
            <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
            <p className="font-mono-data text-base font-bold" style={{ color: accent }}>{value}</p>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{unit}</p>
          </div>
        ))}
      </div>

      {/* Amount input */}
      <div className="mb-3">
        <label className="block text-xs font-mono-data font-medium uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
          Amount ($UPT)
        </label>
        <div className="relative">
          <input
            type="number"
            min="0"
            step="0.0001"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0000"
            className="w-full font-mono-data text-sm rounded-lg py-2.5 px-4 pr-14 outline-none transition-colors bg-white/5"
            style={{ border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
          />
          <button
            type="button"
            onClick={() => setAmount(maxVal)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono-data"
            style={{ color: 'var(--accent-blue)' }}
          >
            MAX
          </button>
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          className="flex items-start gap-2 px-3 py-2.5 rounded-lg text-xs font-mono-data mb-3 animate-fade-in-up"
          style={
            feedback.type === 'success'
              ? { background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)', color: 'var(--accent-green)' }
              : { background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', color: 'var(--accent-red)' }
          }
        >
          {feedback.type === 'success'
            ? <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
            : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
          {feedback.msg}
        </div>
      )}

      {/* Processing bar */}
      {processing && (
        <div
          className="relative h-8 mb-3 overflow-hidden rounded-lg"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(56,189,248,0.2)' }}
        >
          <div className="absolute inset-0 flex items-center justify-center text-xs font-mono-data gap-2" style={{ color: 'var(--accent-blue)' }}>
            <RefreshCw className="w-3 h-3 animate-spin" />
            Broadcasting transaction...
          </div>
          <div
            className="absolute inset-x-0 top-0 h-full w-1/3 animate-scan-line"
            style={{ background: 'linear-gradient(90deg,transparent,rgba(56,189,248,0.18),transparent)' }}
          />
        </div>
      )}

      <Button
        className="w-full"
        loading={processing}
        onClick={handleConfirm}
        variant={tab === 'withdraw' ? 'secondary' : 'primary'}
      >
        {tab === 'deposit'
          ? <><ArrowDownToLine className="w-3.5 h-3.5" /> Confirm Deposit</>
          : <><ArrowUpFromLine className="w-3.5 h-3.5" /> Confirm Withdrawal</>}
      </Button>
    </div>
  );
}
