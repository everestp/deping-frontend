// ─────────────────────────────────────────────
// components/miner/WalletGate.tsx
// ─────────────────────────────────────────────


import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Shield, TrendingUp, Wallet, Zap } from 'lucide-react';

export function WalletGate() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div
        className="glass rounded-2xl p-8 max-w-sm w-full text-center space-y-6 animate-fade-in-up"
        style={{ border: '1px solid var(--border-subtle)' }}
      >
        {/* Icon */}
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mx-auto"
          style={{
            background: 'rgba(56,189,248,0.08)',
            border: '1px solid rgba(56,189,248,0.2)',
          }}
        >
          <Wallet className="w-7 h-7" style={{ color: 'var(--accent-blue)' }} />
        </div>

        {/* Text */}
        <div>
          <h2
            className="font-mono-data text-lg font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            Connect Your Wallet
          </h2>
          <p className="text-sm mt-1.5" style={{ color: 'var(--text-muted)' }}>
            Connect your Phantom wallet to access the Miner Node Console and start
            earning rewards.
          </p>
        </div>

        {/* Feature pills */}
        <div className="flex flex-col gap-2">
          {[
            { icon: Shield,     label: 'Secure on-chain staking',      color: 'var(--accent-blue)' },
            { icon: TrendingUp, label: 'Real-time reward accumulation', color: 'var(--accent-green)' },
            { icon: Zap,        label: '10 $UPT milestone claims',      color: 'var(--accent-amber)' },
          ].map(({ icon: Icon, label, color }) => (
            <div
              key={label}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-left"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)' }}
            >
              <Icon className="w-4 h-4 shrink-0" style={{ color }} />
              <span className="text-xs font-mono-data" style={{ color: 'var(--text-secondary)' }}>
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Wallet adapter button — handles Phantom/Backpack/etc automatically */}
        <div className="flex justify-center">
          <WalletMultiButton />
        </div>
      </div>
    </div>
  );
}
