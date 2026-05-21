import React, { useState, useRef, useEffect } from 'react';
import {
  Cpu,
  ArrowDownToLine,
  ArrowUpFromLine,
  Zap,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  TrendingUp,
  Database,
  Terminal,
  History,
} from 'lucide-react';
import { Card } from '../components/Common/Card';
import { Button } from '../components/Common/Button';
import { useInterval } from '../hooks/useInterval';
import { useSolanaWallet } from '../context/SolanaWallet';

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────
interface PendingTx {
  id: string;
  timestamp: string;
  amount: number;
  signature: string;
  status: 'confirmed' | 'pending';
}

interface TerminalLine {
  id: string;
  text: string;
  type: 'info' | 'reward' | 'warn';
}

// ────────────────────────────────────────────────────────────
// Terminal line generator
// ────────────────────────────────────────────────────────────
const NODE_REGIONS = ['AP-South-1', 'US-East-2', 'EU-Central-1', 'US-West-1', 'SA-East-1'];
const TARGETS_POOL = [
  'https://api.deping.xyz',
  'https://solana.com',
  'https://api.coingecko.com',
  'https://mainnet.helius-rpc.com',
  'https://status.solana.com',
];

function buildTermLine(): TerminalLine {
  const now = new Date();
  const ts = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} UTC`;
  const region = NODE_REGIONS[Math.floor(Math.random() * NODE_REGIONS.length)];
  const target = TARGETS_POOL[Math.floor(Math.random() * TARGETS_POOL.length)];
  const latency = Math.floor(Math.random() * 180) + 12;
  const ok = Math.random() > 0.03;
  const status = ok ? 'HTTP 200 OK' : 'HTTP 503 Service Unavailable';
  return {
    id: Math.random().toString(36).slice(2),
    text: `[${ts}] INGEST: Node ${region} (Ping: ${latency}ms) -> Target: ${target} [${status}]${ok ? ' - Micro-Reward Distributed' : ' - NO REWARD'}`,
    type: ok ? 'reward' : 'warn',
  };
}

function randMicro(): number {
  return parseFloat((Math.random() * 0.05 + 0.03).toFixed(4));
}

// ────────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────────
type TabKey = 'deposit' | 'withdraw';

interface BankPanelProps {
  onChainBalance: number;
  onDeposit: (amount: number) => Promise<void>;
  onWithdraw: (amount: number) => Promise<void>;
  walletBalance: number;
}

function BankPanel({ onChainBalance, onDeposit, onWithdraw, walletBalance }: BankPanelProps) {
  const [tab, setTab] = useState<TabKey>('deposit');
  const [amount, setAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

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
    if (tab === 'deposit') {
      await onDeposit(val);
    } else {
      await onWithdraw(val);
    }
    setProcessing(false);
    setAmount('');
    setFeedback({
      type: 'success',
      msg: tab === 'deposit' ? `Deposited ${val.toFixed(4)} $UPT to escrow.` : `Withdrawal of ${val.toFixed(4)} $UPT initiated.`,
    });
    setTimeout(() => setFeedback(null), 4000);
  }

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Database className="w-4 h-4 text-sky-400" />
        <h2 className="font-semibold text-[var(--text-primary)]">On-Chain Bank</h2>
        <span className="ml-auto text-xs font-mono-data text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/8 border border-emerald-500/20">
          $UPT
        </span>
      </div>

      {/* Tabs */}
      <div className="flex rounded-lg bg-white/4 border border-[var(--border-subtle)] p-0.5 mb-4">
        {(['deposit', 'withdraw'] as TabKey[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setFeedback(null); setAmount(''); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-mono-data font-medium transition-all capitalize ${
              tab === t
                ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            }`}
          >
            {t === 'deposit' ? <ArrowDownToLine className="w-3.5 h-3.5" /> : <ArrowUpFromLine className="w-3.5 h-3.5" />}
            {t}
          </button>
        ))}
      </div>

      {/* Info row */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="text-center px-3 py-2.5 rounded-lg bg-white/3 border border-[var(--border-subtle)]">
          <p className="text-xs text-[var(--text-muted)] mb-0.5">On-Chain Balance</p>
          <p className="font-mono-data text-base font-bold text-sky-400">{onChainBalance.toFixed(4)}</p>
          <p className="text-[10px] text-[var(--text-muted)]">$UPT</p>
        </div>
        <div className="text-center px-3 py-2.5 rounded-lg bg-white/3 border border-[var(--border-subtle)]">
          <p className="text-xs text-[var(--text-muted)] mb-0.5">Wallet Balance</p>
          <p className="font-mono-data text-base font-bold text-emerald-400">{walletBalance.toFixed(4)}</p>
          <p className="text-[10px] text-[var(--text-muted)]">SOL</p>
        </div>
      </div>

      {/* Amount input */}
      <div className="mb-3">
        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
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
            className="w-full bg-white/5 border border-[var(--border-subtle)] hover:border-sky-500/30 focus:border-sky-500/60 rounded-lg py-2.5 px-4 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-colors font-mono-data"
          />
          <button
            type="button"
            onClick={() => setAmount(tab === 'withdraw' ? onChainBalance.toFixed(4) : (walletBalance * 0.5).toFixed(4))}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-sky-400 hover:text-sky-300 font-mono-data"
          >
            MAX
          </button>
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`flex items-start gap-2 px-3 py-2.5 rounded-lg text-xs mb-3 animate-fade-in-up ${
          feedback.type === 'success'
            ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400'
            : 'bg-red-500/10 border border-red-500/25 text-red-400'
        }`}>
          {feedback.type === 'success'
            ? <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
            : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
          {feedback.msg}
        </div>
      )}

      {/* Processing overlay */}
      {processing && (
        <div className="relative h-8 mb-3 overflow-hidden rounded-lg bg-white/3 border border-sky-500/20">
          <div className="absolute inset-0 flex items-center justify-center text-xs text-sky-400 font-mono-data gap-2">
            <RefreshCw className="w-3 h-3 animate-spin" />
            Broadcasting transaction...
          </div>
          <div className="absolute inset-x-0 top-0 h-full w-1/3 bg-gradient-to-r from-transparent via-sky-400/20 to-transparent animate-scan-line" />
        </div>
      )}

      <Button
        className="w-full"
        loading={processing}
        onClick={handleConfirm}
        variant={tab === 'withdraw' ? 'secondary' : 'primary'}
      >
        {tab === 'deposit' ? (
          <><ArrowDownToLine className="w-3.5 h-3.5" /> Confirm Deposit</>
        ) : (
          <><ArrowUpFromLine className="w-3.5 h-3.5" /> Confirm Withdrawal</>
        )}
      </Button>
    </Card>
  );
}

// ────────────────────────────────────────────────────────────
// Main page
// ────────────────────────────────────────────────────────────
const MILESTONE = 10;

export default function MinerNode() {
  const { wallet, connect, connecting } = useSolanaWallet();

  const [offChainBalance, setOffChainBalance] = useState(3.8241);
  const [onChainBalance, setOnChainBalance] = useState(24.5000);
  const [pendingTxs, setPendingTxs] = useState<PendingTx[]>([]);
  const [termLines, setTermLines] = useState<TerminalLine[]>(() =>
    Array.from({ length: 6 }, buildTermLine)
  );
  const [claiming, setClaiming] = useState(false);
  const [claimAlert, setClaimAlert] = useState<string | null>(null);
  const [claimSuccess, setClaimSuccess] = useState<string | null>(null);
  const termRef = useRef<HTMLDivElement>(null);

  // Micro-reward ticker: every 2.5s
  useInterval(() => {
    const inc = randMicro();
    setOffChainBalance((prev) => parseFloat((prev + inc).toFixed(6)));
  }, 2500);

  // Terminal line feed: every 3.2s
  useInterval(() => {
    const line = buildTermLine();
    setTermLines((prev) => [...(prev || []).slice(-29), line]);
  }, 3200);

  // Auto-scroll terminal
  useEffect(() => {
    if (termRef.current) {
      termRef.current.scrollTop = termRef.current.scrollHeight;
    }
  }, [termLines]);

  async function handleClaim() {
    setClaimAlert(null);
    setClaimSuccess(null);

    if (offChainBalance < MILESTONE) {
      setClaimAlert(
        `Milestone Constraint Failed: You must accumulate a minimum of ${MILESTONE}.0 tokens off-chain to sync state to the blockchain.`
      );
      return;
    }

    setClaiming(true);
    await new Promise((r) => setTimeout(r, 1800));

    // Step 1: Compute fractional remainder
    const remainder = parseFloat((offChainBalance % MILESTONE).toFixed(6));
    const claimed = 10;

    // Step 2: Reset off-chain to remainder
    setOffChainBalance(remainder);

    // Step 3: Increment on-chain by exactly 10.0
    setOnChainBalance((prev) => parseFloat((prev + claimed).toFixed(4)));

    // Step 4: Push record to pending transactions ledger
    const sig = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const now = new Date();
    const ts = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} UTC`;

    const tx: PendingTx = {
      id: `tx_${Math.random().toString(36).slice(2, 10)}`,
      timestamp: ts,
      amount: claimed,
      signature: sig,
      status: 'confirmed',
    };
    setPendingTxs((prev) => [tx, ...(prev || [])]);

    // Step 5: Mock Anchor CPI update — add terminal confirmation
    setTermLines((prev) => [
      ...(prev || []),
      {
        id: Math.random().toString(36).slice(2),
        text: `[${ts}] ANCHOR CPI: Claim(${claimed} $UPT) -> Wallet settled. Sig: ${sig.slice(0, 20)}... [CONFIRMED]`,
        type: 'reward',
      },
    ]);

    setClaimSuccess(`Successfully claimed ${claimed} $UPT on-chain. Remainder ${remainder.toFixed(6)} $UPT retained off-chain.`);
    setTimeout(() => setClaimSuccess(null), 6000);
    setClaiming(false);
  }

  async function handleDeposit(amount: number) {
    await new Promise((r) => setTimeout(r, 1000));
    setOnChainBalance((prev) => parseFloat((prev + amount).toFixed(4)));
  }

  async function handleWithdraw(amount: number) {
    await new Promise((r) => setTimeout(r, 1000));
    setOnChainBalance((prev) => parseFloat((prev - amount).toFixed(4)));
  }

  const progress = Math.min((offChainBalance % MILESTONE) / MILESTONE, 1);
  const progressPct = (progress * 100).toFixed(1);
  const nearThreshold = offChainBalance >= MILESTONE;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-mono-data text-xl font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <Cpu className="w-5 h-5 text-sky-400" />
            Miner Node Console
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            Rust CLI worker stream + on-chain settlement interface
          </p>
        </div>

        {!wallet?.connected && (
          <Button size="sm" loading={connecting} onClick={connect}>
            Connect Wallet
          </Button>
        )}
      </div>

      {/* Dual-Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Off-chain rewards card */}
        <Card className="border-sky-500/15">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-sky-400" />
              <h3 className="font-semibold text-[var(--text-primary)]">Off-Chain Rewards</h3>
            </div>
            <span className="text-[10px] font-mono-data text-sky-400 px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20">
              ACCUMULATING
            </span>
          </div>

          <div className="mb-4">
            <span className="font-mono-data text-3xl font-bold text-sky-400">
              {offChainBalance.toFixed(6)}
            </span>
            <span className="font-mono-data text-sm text-[var(--text-muted)] ml-2">$UPT</span>
          </div>

          {/* 10-Token milestone progress gauge */}
          <div className="mb-2">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-[var(--text-muted)]">10 Token Sync Milestone</span>
              <span className={`font-mono-data font-medium ${nearThreshold ? 'text-emerald-400' : 'text-sky-400'}`}>
                {(offChainBalance % MILESTONE).toFixed(4)} / {MILESTONE}.0
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-white/8 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${nearThreshold ? 'bg-emerald-400 progress-glow' : 'bg-sky-400 progress-glow'}`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[10px] font-mono-data text-[var(--text-muted)]">
                +0.03 – 0.08 $UPT every 2.5s
              </span>
              <span className={`text-[10px] font-mono-data font-semibold ${nearThreshold ? 'text-emerald-400' : 'text-sky-400'}`}>
                {progressPct}%
              </span>
            </div>
          </div>

          {/* Claim alerts */}
          {claimAlert && (
            <div className="mt-3 flex items-start gap-2 px-3 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-mono-data animate-fade-in-up">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              {claimAlert}
            </div>
          )}
          {claimSuccess && (
            <div className="mt-3 flex items-start gap-2 px-3 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-mono-data animate-fade-in-up">
              <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
              {claimSuccess}
            </div>
          )}

          <Button
            className="w-full mt-4"
            variant={nearThreshold ? 'success' : 'secondary'}
            loading={claiming}
            onClick={handleClaim}
          >
            <Zap className="w-3.5 h-3.5" />
            {claiming
              ? 'Syncing to blockchain...'
              : nearThreshold
              ? 'Claim 10 $UPT On-Chain'
              : `Claim Reward Pipeline (${offChainBalance.toFixed(2)} / ${MILESTONE})`
            }
          </Button>
        </Card>

        {/* On-chain balance card */}
        <Card className="border-emerald-500/15">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              <h3 className="font-semibold text-[var(--text-primary)]">On-Chain Balance</h3>
            </div>
            <span className="text-[10px] font-mono-data text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
              SETTLED
            </span>
          </div>

          <div className="mb-4">
            <span className="font-mono-data text-3xl font-bold text-emerald-400">
              {onChainBalance.toFixed(4)}
            </span>
            <span className="font-mono-data text-sm text-[var(--text-muted)] ml-2">$UPT</span>
          </div>

          <div className="space-y-2">
            {[
              { label: 'Network', value: wallet?.connected ? `Solana ${wallet?.network || 'devnet'}` : 'Not connected' },
              { label: 'Public Key', value: wallet?.connected && wallet?.publicKey ? `${wallet.publicKey.slice(0, 6)}...${wallet.publicKey.slice(-6)}` : '—' },
              { label: 'SOL Balance', value: wallet?.connected ? `${(wallet?.balance || 0).toFixed(4)} SOL` : '—' },
              { label: 'Claims Total', value: String(pendingTxs?.length || 0) },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <span className="text-[var(--text-muted)]">{label}</span>
                <span className="font-mono-data text-xs text-[var(--text-primary)]">{value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bank panel + Tx ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <BankPanel
          onChainBalance={onChainBalance}
          onDeposit={handleDeposit}
          onWithdraw={handleWithdraw}
          walletBalance={wallet?.balance || 0}
        />

        {/* Pending Transactions Ledger */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <History className="w-4 h-4 text-amber-400" />
            <h2 className="font-semibold text-[var(--text-primary)]">Claim Ledger</h2>
            <span className="ml-auto text-xs font-mono-data text-[var(--text-muted)]">
              {pendingTxs?.length || 0} record{(pendingTxs?.length || 0) !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {(pendingTxs || []).length === 0 && (
              <div className="text-center py-8 text-[var(--text-muted)] text-sm">
                <History className="w-6 h-6 mx-auto mb-2 opacity-30" />
                No claims yet — accumulate 10 $UPT to claim.
              </div>
            )}
            {(pendingTxs || []).map((tx) => (
              <div
                key={tx?.id || Math.random()}
                className="px-3 py-2.5 rounded-lg bg-white/3 border border-[var(--border-subtle)] animate-slide-in-right"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono-data text-xs font-semibold text-emerald-400">
                    +{(tx?.amount || 0).toFixed(4)} $UPT
                  </span>
                  <span className={`text-[10px] font-mono-data px-1.5 py-0.5 rounded border ${
                    tx?.status === 'confirmed'
                      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25'
                      : 'text-amber-400 bg-amber-500/10 border-amber-500/25'
                  }`}>
                    {(tx?.status || 'pending').toUpperCase()}
                  </span>
                </div>
                <p className="font-mono-data text-[10px] text-[var(--text-muted)] truncate">
                  Sig: {(tx?.signature || '').slice(0, 20)}...
                </p>
                <p className="font-mono-data text-[10px] text-[var(--text-muted)] mt-0.5">{tx?.timestamp || ''}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Terminal */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <h2 className="font-semibold text-[var(--text-primary)]">Rust CLI Worker Stream</h2>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-emerald-400 font-mono-data">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-dot" />
            LIVE
          </div>
        </div>

        <div
          ref={termRef}
          className="terminal-bg rounded-xl p-4 h-64 overflow-y-auto space-y-0.5"
        >
          {(termLines || []).map((line, i) => (
            <div
              key={line?.id || i}
              className={`text-xs font-mono-data leading-relaxed ${
                line?.type === 'reward'
                  ? 'text-emerald-300'
                  : line?.type === 'warn'
                  ? 'text-amber-400'
                  : 'text-sky-300'
              } ${i === (termLines || []).length - 1 ? 'animate-fade-in-up' : ''}`}
            >
              {line?.text || ''}
            </div>
          ))}
          <div className="flex items-center gap-1 text-xs font-mono-data text-emerald-400 mt-1">
            <span className="opacity-70">$</span>
            <span className="animate-terminal-blink">_</span>
          </div>
        </div>
      </Card>
    </div>
  );
}