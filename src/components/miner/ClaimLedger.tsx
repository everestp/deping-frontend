// ─────────────────────────────────────────────
// components/miner/ClaimLedger.tsx
// ─────────────────────────────────────────────


import { History } from 'lucide-react';
import type { PendingTx } from '../../types/miner';

interface ClaimLedgerProps {
  transactions: PendingTx[];
}

export function ClaimLedger({ transactions }: ClaimLedgerProps) {
  return (
    <div className="glass rounded-2xl p-5" style={{ border: '1px solid var(--border-subtle)' }}>
      {/* Title */}
      <div className="flex items-center gap-2 mb-4">
        <History className="w-4 h-4" style={{ color: 'var(--accent-amber)' }} />
        <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Claim Ledger</h2>
        <span className="ml-auto text-xs font-mono-data" style={{ color: 'var(--text-muted)' }}>
          {transactions.length} record{transactions.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* List */}
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {transactions.length === 0 ? (
          <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
            <History className="w-6 h-6 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No claims yet — accumulate 10 $UPT to claim.</p>
          </div>
        ) : (
          transactions.map((tx) => (
            <div
              key={tx.id}
              className="px-3 py-2.5 rounded-lg animate-slide-in-right"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)' }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono-data text-xs font-semibold" style={{ color: 'var(--accent-green)' }}>
                  +{tx.amount.toFixed(4)} $UPT
                </span>
                <span
                  className="text-[10px] font-mono-data px-1.5 py-0.5 rounded"
                  style={
                    tx.status === 'confirmed'
                      ? { color: 'var(--accent-green)', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)' }
                      : { color: 'var(--accent-amber)', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)' }
                  }
                >
                  {tx.status.toUpperCase()}
                </span>
              </div>
              <p className="font-mono-data text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
                Sig: {tx.signature.slice(0, 22)}...
              </p>
              <p className="font-mono-data text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {tx.timestamp}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
