// ─────────────────────────────────────────────
// components/miner/MinerDashboard.tsx
// ─────────────────────────────────────────────

import {
    AlertCircle,
    CheckCircle,
    Cpu,
    Database,
    TrendingUp,
    Zap
} from 'lucide-react';
import { useState } from 'react';
import type { PendingTx, RunnerNode, TerminalLine } from '../../types/miner';
import { Button } from '../Common/Button';
import { StakePanel } from './StakePanel';

const MILESTONE = 10;

interface WalletInfo {
  publicKey: string;
  balance: number;
  network?: string;
  connected: boolean;
}

interface DashboardProps {
  runner: RunnerNode;
  wallet: WalletInfo;
  offChainBalance: number;
  onChainBalance: number;
  onChainRewardBalance: number;
  stakeBalance: number;
  pendingTxs: PendingTx[];
  termLines: TerminalLine[];
  claiming: boolean;
  claimAlert: string | null;
  claimSuccess: string | null;
  onClaim: () => Promise<void>;
  onStakeMore: (amount: number) => Promise<string>;
  onWithdrawStake: (amount: number) => Promise<string>;
  onDeleteAccount: (amount: number) => Promise<string>;
  validateUnstake: (payload: { signature: string; node_pda: string; amount: number }) => Promise<void>;
}

export function MinerDashboard({
  runner,
  wallet,
  offChainBalance,
  
  onChainRewardBalance,
  stakeBalance,
  
  claiming,
  claimAlert,
  claimSuccess,
  onClaim,
  onStakeMore,
  onWithdrawStake,
  onDeleteAccount,
  validateUnstake,
}: DashboardProps) {
  // const [stakeAmt, setStakeAmt] = useState('');
  // const [unstakeAmt, setUnstakeAmt] = useState('');
  // const [stakeLoading, setStakeLoading] = useState(false);
  // const [unstakeLoading, setUnstakeLoading] = useState(false);
  // const [deleteLoading, setDeleteLoading] = useState(false);


  const cycleBalance = offChainBalance % MILESTONE;
  const progressPct = Math.min((cycleBalance / MILESTONE) * 100, 100);

  const nodePubkeyDisplay = runner?.node_pubkey
    ? `${runner.node_pubkey.slice(0, 6)}...${runner.node_pubkey.slice(-6)}`
    : 'Unregistered';

  const walletPubkeyDisplay =
    wallet?.publicKey && wallet.connected
      ? `${wallet.publicKey.slice(0, 6)}...${wallet.publicKey.slice(-6)}`
      : '—';


 


  return (
    <div className="space-y-5 animate-fade-in-up">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1
            className="font-mono text-lg font-semibold flex items-center gap-2"
            style={{ color: 'var(--text-primary)' }}
          >
            <Cpu className="w-4 h-4" style={{ color: 'var(--accent-blue)' }} />
            Miner Node Console
          </h1>
          <p className="text-xs mt-0.5 font-mono" style={{ color: 'var(--text-muted)' }}>
            Rust CLI worker · on-chain settlement
          </p>
        </div>

        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg self-start sm:self-auto"
          style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: runner?.is_validator ? 'var(--accent-green)' : 'var(--accent-amber)' }}
          />
          <span className="text-xs font-mono" style={{ color: runner?.is_validator ? 'var(--accent-green)' : 'var(--accent-amber)' }}>
            {nodePubkeyDisplay} · {runner?.is_validator ? 'active' : 'staged'}
          </span>
        </div>
      </div>

      {/* ── Balance Row ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Off-chain: always show */}
        <div
          className="glass rounded-2xl p-5"
          style={{ border: '1px solid rgba(56,189,248,0.2)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" style={{ color: 'var(--accent-blue)' }} />
              <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                Off-chain rewards
              </span>
            </div>
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded"
              style={{ color: 'var(--accent-blue)', background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)' }}
            >
              ACCUMULATING
            </span>
          </div>

          <div className="mb-1">
            <span className="font-mono text-3xl font-bold" style={{ color: 'var(--accent-blue)' }}>
              {offChainBalance.toFixed(4)}
            </span>
            <span className="font-mono text-sm ml-2" style={{ color: 'var(--text-muted)' }}>$DPNG</span>
          </div>
          <p className="text-[11px] font-mono mb-4" style={{ color: 'var(--text-muted)' }}>
            tracked in postgres · not yet on-chain
          </p>

          {/* Progress to next sync */}
          <div className="flex justify-between text-[11px] font-mono mb-1.5">
            <span style={{ color: 'var(--text-muted)' }}>sync milestone</span>
            <span style={{ color: 'var(--text-primary)' }}>
              {cycleBalance.toFixed(4)} / {MILESTONE}.0
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%`, background: 'var(--accent-blue)' }}
            />
          </div>
          <div className="flex justify-between text-[11px] font-mono mt-1.5">
            <span style={{ color: 'var(--text-muted)' }}>
              {(MILESTONE - cycleBalance).toFixed(4)} $DPNG until next sync
            </span>
            <span style={{ color: 'var(--accent-blue)' }}>{progressPct.toFixed(1)}%</span>
          </div>
        </div>

        {/* On-chain claimable */}
        <div
          className="glass rounded-2xl p-5"
          style={{ border: '1px solid rgba(52,211,153,0.2)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4" style={{ color: 'var(--accent-green)' }} />
              <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                Claimable on-chain
              </span>
            </div>
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded"
              style={{ color: 'var(--accent-green)', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}
            >
              
            </span>
          </div>

          <div className="mb-1">
            <span className="font-mono text-3xl font-bold" style={{ color: 'var(--accent-green)' }}>
              {onChainRewardBalance.toFixed(4)}
            </span>
            <span className="font-mono text-sm ml-2" style={{ color: 'var(--text-muted)' }}>$DPNG</span>
          </div>
          <p className="text-[11px] font-mono mb-4" style={{ color: 'var(--text-muted)' }}>
            sitting in solana reward vault · ready to claim
          </p>

          {/* Alerts */}
          {claimAlert && (
            <div
              className="flex items-start gap-2 px-3 py-2.5 rounded-lg text-xs font-mono mb-3"
              style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', color: 'var(--accent-amber)' }}
            >
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              {claimAlert}
            </div>
          )}
          {claimSuccess && (
            <div
              className="flex items-start gap-2 px-3 py-2.5 rounded-lg text-xs font-mono mb-3"
              style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)', color: 'var(--accent-green)' }}
            >
              <CheckCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              {claimSuccess}
            </div>
          )}

          {/* Claim only if onChainRewardBalance > 0 */}
          {onChainRewardBalance > 0 ? (
            <Button
              className="w-full"
              variant="success"
              loading={claiming}
              onClick={onClaim}
            >
              <Zap className="w-3.5 h-3.5" />
              {claiming
                ? 'claiming to wallet...'
                : `claim ${onChainRewardBalance.toFixed(4)} $DPNG`}
            </Button>
          ) : (
            <div
              className="w-full text-center text-xs font-mono py-2.5 rounded-lg"
              style={{ color: 'var(--text-muted)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              no claimable balance · accumulating off-chain
            </div>
          )}

          <div className="mt-4 space-y-2">
            {[
              { label: 'wallet', value: walletPubkeyDisplay },
              { label: 'network', value: wallet?.connected ? `solana ${wallet.network ?? 'devnet'}` : '—' },
              { label: 'DPNG balance', value: wallet?.connected ? `${wallet.balance.toFixed(4)} SOL` : '—' },
              { label: 'Total Staked', value: `${stakeBalance.toFixed(4)} $DPNG` },
              { label: 'all-time earned', value: `${(runner?.total_earned_tokens_all_time || 0).toFixed(4)} $DPNG` },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-xs">
                <span className="font-mono" style={{ color: 'var(--text-muted)' }}>{label}</span>
                <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Stake + Ledger ── */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* 🔥 SWITCHED OUT BankPanel FOR StakePanel AS REQUESTED */}
      <StakePanel
          stakedAmount={stakeBalance}
          walletBalance={wallet?.balance || 0}
          nodePda={runner?.node_pda || ''}
        
          onStakeMore={onStakeMore}
          onWithdrawStake={onWithdrawStake}
          onDeleteAccount={onDeleteAccount}
          validateUnstake={validateUnstake}
        />
    
      </div>

    

    </div>
  );
}