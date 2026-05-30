// ─────────────────────────────────────────────
// components/miner/StakingPayment.tsx
// ─────────────────────────────────────────────

import React, { useState } from 'react';
import { Coins, AlertCircle, CheckCircle, ChevronRight, ShieldCheck } from 'lucide-react';
import { Button } from '../Common/Button';

const MIN_STAKE = 20;

interface StakingPaymentProps {
  walletBalance: number;
  nodePubkey: string;
  staking: boolean;
  error: string | null;
  onStake: (amount: number) => Promise<void>;
}

type Phase = 'idle' | 'signing' | 'validating' | 'done';

export function StakingPayment({
  walletBalance,
  nodePubkey,
  staking,
  error,
  onStake,
}: StakingPaymentProps) {
  const [amount, setAmount]     = useState('');
  const [phase, setPhase]       = useState<Phase>('idle');
  const [localError, setLocalError] = useState<string | null>(null);
  const [success, setSuccess]   = useState<string | null>(null);

  async function handleStake() {
    setLocalError(null);
    setSuccess(null);

    const val = parseFloat(amount);
    if (isNaN(val) || val < MIN_STAKE) {
      setLocalError(`Minimum stake is ${MIN_STAKE} DPNG.`);
      return;
    }
    if (val > walletBalance) {
      setLocalError(`Insufficient balance. Available: ${walletBalance.toFixed(4)} DPNG`);
      return;
    }

    setPhase('signing');
    try {
      await onStake(val);
      setPhase('done');
      setSuccess(`Successfully staked ${val} DPNG. Your node is now a validator.`);
    } catch {
      setPhase('idle');
    }
  }

  const displayError = localError ?? error;
  const isLoading    = staking || phase === 'signing' || phase === 'validating';

  const phaseLabel: Record<Phase, string> = {
    idle:       `Stake & Activate Validator`,
    signing:    'Awaiting wallet signature...',
    validating: 'Verifying on-chain...',
    done:       'Validator Activated!',
  };

  return (
    <div className="max-w-md mx-auto space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="text-center">
        <div
          className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
          style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)' }}
        >
          <ShieldCheck className="w-7 h-7" style={{ color: 'var(--accent-blue)' }} />
        </div>
        <h2 className="font-mono-data text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          Stake to Activate Validator
        </h2>
        <p className="text-sm mt-1.5" style={{ color: 'var(--text-muted)' }}>
          Node registered. Stake a minimum of {MIN_STAKE} DPNG on-chain to activate validator status.
        </p>
      </div>

      <div className="glass rounded-2xl p-5 space-y-4">
        {/* Info rows */}
        <div className="space-y-2.5">
          {[
            { label: 'Node',         value: `${nodePubkey.slice(0,6)}...${nodePubkey.slice(-6)}`, accent: 'var(--accent-green)' },
            { label: 'Min Stake',    value: `${MIN_STAKE} DPNG`,  accent: 'var(--accent-blue)' },
            { label: 'Your Balance', value: `${walletBalance.toFixed(4)} DPNG`, accent: 'var(--accent-amber)' },
          ].map(({ label, value, accent }) => (
            <div
              key={label}
              className="flex items-center justify-between py-2"
              style={{ borderBottom: '1px solid var(--border-subtle)' }}
            >
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{label}</span>
              <span className="font-mono-data text-sm font-semibold" style={{ color: accent }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Amount input */}
        <div>
          <label
            className="block text-xs font-mono-data font-medium uppercase tracking-wider mb-1.5"
            style={{ color: 'var(--text-secondary)' }}
          >
            Stake Amount (DPNG)
          </label>
          <div className="relative">
            <Coins
              className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
              style={{ color: 'var(--text-muted)' }}
            />
            <input
              type="number"
              min={MIN_STAKE}
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`${MIN_STAKE}.00`}
              disabled={isLoading || phase === 'done'}
              className="w-full font-mono-data text-sm rounded-lg py-2.5 pl-9 pr-16 outline-none transition-colors bg-white/5"
              style={{ border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
            />
            <button
              type="button"
              disabled={isLoading || phase === 'done'}
              onClick={() => setAmount(walletBalance.toFixed(2))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono-data"
              style={{ color: 'var(--accent-blue)' }}
            >
              MAX
            </button>
          </div>
          <p className="text-[11px] font-mono-data mt-1" style={{ color: 'var(--text-muted)' }}>
            Minimum {MIN_STAKE} DPNG required
          </p>
        </div>

        {/* Phase progress indicator */}
        {phase !== 'idle' && phase !== 'done' && (
          <div
            className="relative h-8 rounded-lg overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(56,189,248,0.2)' }}
          >
            <div className="absolute inset-0 flex items-center justify-center gap-2 text-xs font-mono-data" style={{ color: 'var(--accent-blue)' }}>
              <span className="animate-pulse">●</span>
              {phaseLabel[phase]}
            </div>
            <div
              className="absolute inset-x-0 top-0 h-full w-1/3 animate-scan-line"
              style={{ background: 'linear-gradient(90deg,transparent,rgba(56,189,248,0.15),transparent)' }}
            />
          </div>
        )}

        {/* Error */}
        {displayError && (
          <div
            className="flex items-start gap-2 px-3 py-2.5 rounded-lg text-xs font-mono-data animate-fade-in-up"
            style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', color: 'var(--accent-red)' }}
          >
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            {displayError}
          </div>
        )}

        {/* Success */}
        {success && (
          <div
            className="flex items-start gap-2 px-3 py-2.5 rounded-lg text-xs font-mono-data animate-fade-in-up"
            style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)', color: 'var(--accent-green)' }}
          >
            <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
            {success}
          </div>
        )}

        <Button
          className="w-full"
          loading={isLoading}
          disabled={phase === 'done'}
          onClick={handleStake}
        >
          <Coins className="w-3.5 h-3.5" />
          {phaseLabel[phase]}
          {phase === 'idle' && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
        </Button>
      </div>
    </div>
  );
}
