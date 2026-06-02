// ─────────────────────────────────────────────
// components/miner/Activate.tsx
// ─────────────────────────────────────────────

import React from 'react';
import { ShieldCheck, Zap } from 'lucide-react';
import { Button } from '../Common/Button';

interface ActivateProps {
  onActivate: () => void;
  loading: boolean;
  error: string | null;
}

export function Activate({ onActivate, loading, error }: ActivateProps) {
  return (
    <div
      className="glass p-8 rounded-2xl text-center max-w-md mx-auto space-y-4 animate-fade-in-up"
      style={{ border: '1px solid var(--border-subtle)' }}
    >
      <div
        className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mx-auto"
        style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}
      >
        <ShieldCheck className="w-7 h-7" style={{ color: 'var(--accent-amber)' }} />
      </div>

      <h2 className="font-mono-data text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
        Activate Validator
      </h2>

      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        Your node is registered but inactive. Initialize your on-chain account to proceed to staking.
        A small SOL rent fee (~0.002 SOL) will be deducted from your wallet.
      </p>

      {error && (
        <div
          className="px-3 py-2.5 rounded-lg text-xs font-mono-data text-left animate-fade-in-up"
          style={{
            background: 'rgba(248,113,113,0.08)',
            border: '1px solid rgba(248,113,113,0.25)',
            color: 'var(--accent-red)',
          }}
        >
          {error}
        </div>
      )}

      <Button onClick={onActivate} loading={loading} className="w-full">
        <Zap className="w-4 h-4" />
        {loading ? 'Initializing on-chain account...' : 'Activate Account'}
      </Button>
    </div>
  );
}
