// ─────────────────────────────────────────────
// components/miner/WalletGate.tsx
// ─────────────────────────────────────────────

import React from 'react';
import { Wallet } from 'lucide-react';
import { Button } from '../Common/Button';

interface WalletGateProps {
  connecting: boolean;
  onConnect: () => void;
}

export function WalletGate({ connecting, onConnect }: WalletGateProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div
        className="glass rounded-2xl p-8 max-w-sm w-full text-center space-y-5 animate-fade-in-up"
        style={{ border: '1px solid var(--border-subtle)' }}
      >
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mx-auto"
          style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)' }}
        >
          <Wallet className="w-7 h-7" style={{ color: 'var(--accent-blue)' }} />
        </div>

        <div>
          <h2
            className="font-mono-data text-lg font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            Connect Your Wallet
          </h2>
          <p className="text-sm mt-1.5" style={{ color: 'var(--text-muted)' }}>
            Connect your Phantom wallet to access the Miner Node Console and
            start earning rewards.
          </p>
        </div>

        <Button className="w-full" loading={connecting} onClick={onConnect}>
          <Wallet className="w-3.5 h-3.5" />
          {connecting ? 'Connecting...' : 'Connect Phantom Wallet'}
        </Button>
      </div>
    </div>
  );
}
