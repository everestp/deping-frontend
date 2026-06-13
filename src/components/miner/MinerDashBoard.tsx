// ─────────────────────────────────────────────
// components/miner/MinerDashboard.tsx
// ─────────────────────────────────────────────

import React from 'react';
import {
  TrendingUp,
  Database,
  Zap,
  AlertCircle,
  CheckCircle,
  Cpu,
} from 'lucide-react';
import { Button } from '../Common/Button';
import { StakePanel } from './StakePanel'; // 🔥 Imported your newly minted Staking Panel
import { ClaimLedger } from './ClaimLedger';
import { TerminalFeed } from './TerminalFeed';
import type { RunnerNode, PendingTx, TerminalLine } from '../../types/miner';

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
  onChainRewardBalance:number;
  stakeBalance: number;
  pendingTxs: PendingTx[];
  termLines: TerminalLine[];
  claiming: boolean;
  claimAlert: string | null;
  claimSuccess: string | null;
  onClaim: () => Promise<void>;
  
  // 🔥 Updated Action Hooks
  onStakeMore: (amount: number) => Promise<string>;
  onWithdrawStake: (amount: number) => Promise<string>;
  onDeleteAccount: (amount: number) => Promise<string>;
  validateUnstake: (payload: { signature: string; node_pda: string; amount: number }) => Promise<void>;
}

export function MinerDashboard({
runner,
  wallet,
  offChainBalance,
  onChainBalance,
  onChainRewardBalance,
  stakeBalance,
  pendingTxs,
  termLines,
  claiming,
  claimAlert,
  claimSuccess,
  onClaim,
  onStakeMore,
  onWithdrawStake,
  onDeleteAccount,
  validateUnstake,
}: DashboardProps) {
  const cycleBalance  = offChainBalance % MILESTONE;
  const progressPct   = Math.min((cycleBalance / MILESTONE) * 100, 100).toFixed(1);
  const nearThreshold = offChainBalance >= MILESTONE;

  // Safe layout extraction selectors to prevent edge-case undefined component crashes
  const nodePubkeyDisplay = runner?.node_pubkey 
    ? `${runner.node_pubkey.slice(0, 6)}...${runner.node_pubkey.slice(-6)}` 
    : "Unregistered Node";

  const walletPubkeyDisplay = wallet?.publicKey && wallet.connected
    ? `${wallet.publicKey.slice(0, 6)}...${wallet.publicKey.slice(-6)}`
    : "Disconnected";

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* ── Page Header ───────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1
            className="font-mono-data text-xl font-semibold flex items-center gap-2"
            style={{ color: 'var(--text-primary)' }}
          >
            <Cpu className="w-5 h-5" style={{ color: 'var(--accent-blue)' }} />
            Miner Node Console
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Rust CLI worker stream · on-chain settlement
          </p>
        </div>

        {/* Node Status Badge Indicator */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg self-start sm:self-auto"
          style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse-dot"
            style={{ background: runner?.is_validator ? 'var(--accent-green)' : 'var(--accent-amber)' }}
          />
          <span className="text-xs font-mono-data" style={{ color: runner?.is_validator ? 'var(--accent-green)' : 'var(--accent-amber)' }}>
            {nodePubkeyDisplay} ({runner?.is_validator ? 'Active' : 'Staged'})
          </span>
        </div>
      </div>

      {/* ── Dual Balance Metrics Row ─────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Off-Chain Rewards Accumulator Card */}
        <div
          className="glass rounded-2xl p-5"
          style={{ border: '1px solid rgba(56,189,248,0.15)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" style={{ color: 'var(--accent-blue)' }} />
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Off-Chain Rewards</h3>
            </div>
            <span
              className="text-[10px] font-mono-data px-2 py-0.5 rounded"
              style={{ color: 'var(--accent-blue)', background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)' }}
            >
              ACCUMULATING
            </span>
          </div>

          <div className="mb-4">
            <span className="font-mono-data text-3xl font-bold" style={{ color: 'var(--accent-blue)' }}>
              {offChainBalance.toFixed(6)}
            </span>
            <span className="font-mono-data text-sm ml-2" style={{ color: 'var(--text-muted)' }}>$UPT</span>
          </div>

          {/* Milestone Sync Progress */}
          <div className="mb-2">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span style={{ color: 'var(--text-muted)' }}>10 Token Sync Milestone</span>
              <span
                className="font-mono-data font-medium"
                style={{ color: nearThreshold ? 'var(--accent-green)' : 'var(--accent-blue)' }}
              >
                {cycleBalance.toFixed(4)} / {MILESTONE}.0
              </span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div
                className="h-full rounded-full transition-all duration-700 progress-glow"
                style={{
                  width: `${progressPct}%`,
                  background: nearThreshold ? 'var(--accent-green)' : 'var(--accent-blue)',
                }}
              />
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[10px] font-mono-data" style={{ color: 'var(--text-muted)' }}>
                +0.03 – 0.08 $UPT every 2.5 s
              </span>
              <span
                className="text-[10px] font-mono-data font-semibold"
                style={{ color: nearThreshold ? 'var(--accent-green)' : 'var(--accent-blue)' }}
              >
                {progressPct}%
              </span>
            </div>
          </div>

          {/* Operational Warnings / Status Success Alerts */}
          {claimAlert && (
            <div
              className="mt-3 flex items-start gap-2 px-3 py-2.5 rounded-lg text-xs font-mono-data animate-fade-in-up"
              style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', color: 'var(--accent-amber)' }}
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              {claimAlert}
            </div>
          )}
          {claimSuccess && (
            <div
              className="mt-3 flex items-start gap-2 px-3 py-2.5 rounded-lg text-xs font-mono-data animate-fade-in-up"
              style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)', color: 'var(--accent-green)' }}
            >
              <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
              {claimSuccess}
            </div>
          )}

          <Button
            className="w-full mt-4"
            variant={nearThreshold ? 'success' : 'secondary'}
            loading={claiming}
            onClick={onClaim}
          >
            <Zap className="w-3.5 h-3.5" />
            {claiming
              ? 'Syncing to blockchain...'
              : nearThreshold
                ? `Claim ${onChainRewardBalance} $UPT On-Chain`
                : `Accumulating… (${offChainBalance.toFixed(2)} / ${MILESTONE})`}
          </Button>
        </div>

        {/* On-Chain Settled Vault Configuration Panel */}
        <div
          className="glass rounded-2xl p-5"
          style={{ border: '1px solid rgba(52,211,153,0.15)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4" style={{ color: 'var(--accent-green)' }} />
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>On-Chain Balance</h3>
            </div>
            <span
              className="text-[10px] font-mono-data px-2 py-0.5 rounded"
              style={{ color: 'var(--accent-green)', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}
            >
              SETTLED
            </span>
          </div>

          <div className="mb-4">
            <span className="font-mono-data text-3xl font-bold" style={{ color: 'var(--accent-green)' }}>
              {onChainBalance.toFixed(4)}
            </span>
            <span className="font-mono-data text-sm ml-2" style={{ color: 'var(--text-muted)' }}>$UPT</span>
          </div>

          <div className="space-y-2">
            {[
              { label: 'Network',       value: wallet?.connected ? `Solana ${wallet.network ?? 'devnet'}` : '—' },
              { label: 'Wallet Address', value: walletPubkeyDisplay },
              { label: 'SOL Balance',   value: wallet?.connected ? `${wallet.balance.toFixed(4)} SOL` : '—' },
              { label: 'Node Region',   value: runner?.region || 'Unknown' },
              { label: 'Total Staked',  value: `${(stakeBalance || 0).toFixed(2)} DPNG` },
              { label: 'All-Time Earned', value: `${(runner?.total_earned_tokens_all_time || 0).toFixed(4)} $UPT` },
              { label: 'Claim Count',   value: String(pendingTxs?.length || 0) },
              { label: 'Validator Status', value: runner?.is_validator ? '✓ Active' : '✗ Inactive' },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                <span className="font-mono-data text-xs" style={{ color: 'var(--text-primary)' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Controls Row: Staking Interface + Ledger ── */}
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
        
        {/* Historical Claims Settlement Log */}
        <ClaimLedger transactions={pendingTxs} />
      </div>

      {/* ── Terminal Log Stream Panel ────────────────── */}
      <TerminalFeed lines={termLines} />
    </div>
  );
}