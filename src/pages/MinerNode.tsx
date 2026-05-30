// ─────────────────────────────────────────────
// pages/MinerNode.tsx
// ─────────────────────────────────────────────

import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Cpu } from 'lucide-react';

import { WalletGate }      from '../components/miner/WalletGate';
import { RegForm }         from '../components/miner/RegForm';
import { StakingPayment }  from '../components/miner/StakingPayment';
import { Dashboard }       from '../components/miner/Dashboard';

import {
  getRunnerMe,
  registerRunner,
  validateStakePayment,
  sendHeartbeat,
  ApiError,
} from '../api/node-api';

import { useSolanaWallet } from '../context/SolanaWallet';
import { useInterval }     from '../hooks/useInterval';

import type {
  MinerView,
  RunnerNode,
  PendingTx,
  TerminalLine,
  RegisterPayload,
} from '../types/miner';

// ── Terminal helpers ────────────────────────────────────────

const NODE_REGIONS  = ['AP-South-1', 'US-East-2', 'EU-Central-1', 'US-West-1', 'SA-East-1'];
const TARGETS_POOL  = [
  'https://api.deping.xyz',
  'https://solana.com',
  'https://api.coingecko.com',
  'https://mainnet.helius-rpc.com',
  'https://status.solana.com',
];

function buildTermLine(): TerminalLine {
  const now    = new Date();
  const ts     = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')} UTC`;
  const region = NODE_REGIONS[Math.floor(Math.random() * NODE_REGIONS.length)];
  const target = TARGETS_POOL[Math.floor(Math.random() * TARGETS_POOL.length)];
  const ms     = Math.floor(Math.random() * 180) + 12;
  const ok     = Math.random() > 0.03;
  return {
    id:   Math.random().toString(36).slice(2),
    text: `[${ts}] INGEST: Node ${region} (Ping: ${ms}ms) -> ${target} [${ok ? 'HTTP 200 OK' : 'HTTP 503'}]${ok ? ' - Micro-Reward Distributed' : ' - NO REWARD'}`,
    type: ok ? 'reward' : 'warn',
  };
}

function randMicro(): number {
  return parseFloat((Math.random() * 0.05 + 0.03).toFixed(4));
}

function nowTs(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')} UTC`;
}

// ── Component ───────────────────────────────────────────────

export default function MinerNode() {
  const { wallet, connect, connecting } = useSolanaWallet();

  // ── View state ─────────────────────────────────────────
  const [view, setView]       = useState<MinerView>('loading');
  const [runner, setRunner]   = useState<RunnerNode | null>(null);

  // ── Registration ───────────────────────────────────────
  const [registering, setRegistering] = useState(false);
  const [regError, setRegError]       = useState<string | null>(null);

  // ── Staking ────────────────────────────────────────────
  const [staking, setStaking]         = useState(false);
  const [stakeError, setStakeError]   = useState<string | null>(null);

  // ── Dashboard ──────────────────────────────────────────
  const [offChainBalance, setOffChainBalance] = useState(0);
  const [onChainBalance, setOnChainBalance]   = useState(0);
  const [pendingTxs, setPendingTxs]           = useState<PendingTx[]>([]);
  const [termLines, setTermLines]             = useState<TerminalLine[]>(() =>
    Array.from({ length: 6 }, buildTermLine),
  );
  const [claiming, setClaiming]               = useState(false);
  const [claimAlert, setClaimAlert]           = useState<string | null>(null);
  const [claimSuccess, setClaimSuccess]       = useState<string | null>(null);

  // ── Boot: resolve view from wallet + API ───────────────
  useEffect(() => {
    if (!wallet?.connected || !wallet?.publicKey) {
      setView('no-wallet');
      return;
    }

    setView('loading');

    getRunnerMe(wallet.publicKey)
      .then((r) => {
        setRunner(r);
        setOffChainBalance(r.offchain_accumulated_tokens);
        setOnChainBalance(r.total_earned_tokens_all_time);
        // If registered but not yet a validator → go to stake screen
        setView(r.is_validator ? 'dashboard' : 'stake');
      })
      .catch((err: ApiError) => {
        // 404 → never registered
        if (err.status === 404) {
          setView('register');
        } else {
          // unexpected — let user register/retry
          setView('register');
        }
      });
  }, [wallet?.connected, wallet?.publicKey]);

  // ── Heartbeat every 30 s ───────────────────────────────
  useInterval(() => {
    if (view === 'dashboard' && runner?.node_pubkey) {
      sendHeartbeat(runner.node_pubkey);
    }
  }, 30_000);

  // ── Off-chain micro-reward tick every 2.5 s ────────────
  useInterval(() => {
    if (view === 'dashboard') {
      setOffChainBalance((p) => parseFloat((p + randMicro()).toFixed(6)));
    }
  }, 2_500);

  // ── Terminal line every 3.2 s ──────────────────────────
  useInterval(() => {
    if (view === 'dashboard') {
      setTermLines((prev) => [...prev.slice(-29), buildTermLine()]);
    }
  }, 3_200);

  // ── Handlers ───────────────────────────────────────────

  const handleRegister = useCallback(async (payload: RegisterPayload) => {
    setRegError(null);
    setRegistering(true);
    try {
      const r = await registerRunner(payload);
      setRunner(r);
      setOffChainBalance(r.offchain_accumulated_tokens);
      setOnChainBalance(r.total_earned_tokens_all_time);
      // Always move to stake — is_validator is false after register
      setView('stake');
    } catch (err: unknown) {
      setRegError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setRegistering(false);
    }
  }, []);

  const handleStake = useCallback(async (amount: number) => {
    if (!wallet?.publicKey) return;
    setStakeError(null);
    setStaking(true);

    try {
      // 1. Fire on-chain Solana transaction via wallet adapter
      //    Replace with your real Anchor/web3.js staking call.
      //    The wallet returns a confirmed tx_signature automatically.
      const tx_signature: string = await wallet.sendStakeTransaction(amount);

      // 2. Tell backend to verify + flip is_validator = true
      const updated = await validateStakePayment(amount, tx_signature);

      setRunner(updated);
      setOffChainBalance(updated.offchain_accumulated_tokens);
      setOnChainBalance(updated.total_earned_tokens_all_time);

      // Short pause so StakingPayment can show its success state
      await new Promise((r) => setTimeout(r, 1200));
      setView('dashboard');
    } catch (err: unknown) {
      setStakeError(err instanceof Error ? err.message : 'Staking failed. Please try again.');
      throw err; // let StakingPayment reset its local phase
    } finally {
      setStaking(false);
    }
  }, [wallet]);

  const handleClaim = useCallback(async () => {
    setClaimAlert(null);
    setClaimSuccess(null);

    if (offChainBalance < 10) {
      setClaimAlert(
        'Milestone Constraint: Accumulate a minimum of 10.0 tokens off-chain before syncing to blockchain.',
      );
      return;
    }

    setClaiming(true);
    await new Promise((r) => setTimeout(r, 1_800));

    const claimed    = 10;
    const remainder  = parseFloat((offChainBalance % 10).toFixed(6));
    const sig        = Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16),
    ).join('');
    const ts = nowTs();

    setOffChainBalance(remainder);
    setOnChainBalance((p) => parseFloat((p + claimed).toFixed(4)));

    const tx: PendingTx = {
      id:        `tx_${Math.random().toString(36).slice(2, 10)}`,
      timestamp: ts,
      amount:    claimed,
      signature: sig,
      status:    'confirmed',
    };
    setPendingTxs((p) => [tx, ...p]);

    setTermLines((p) => [
      ...p,
      {
        id:   Math.random().toString(36).slice(2),
        text: `[${ts}] ANCHOR CPI: Claim(${claimed} $UPT) -> Wallet settled. Sig: ${sig.slice(0, 20)}... [CONFIRMED]`,
        type: 'reward',
      },
    ]);

    setClaimSuccess(`Claimed ${claimed} $UPT on-chain. Remainder ${remainder.toFixed(6)} $UPT retained off-chain.`);
    setTimeout(() => setClaimSuccess(null), 6_000);
    setClaiming(false);
  }, [offChainBalance]);

  const handleDeposit = useCallback(async (amount: number) => {
    await new Promise((r) => setTimeout(r, 1_000));
    setOnChainBalance((p) => parseFloat((p + amount).toFixed(4)));
  }, []);

  const handleWithdraw = useCallback(async (amount: number) => {
    await new Promise((r) => setTimeout(r, 1_000));
    setOnChainBalance((p) => parseFloat((p - amount).toFixed(4)));
  }, []);

  // ── Render ─────────────────────────────────────────────

  // Loading spinner
  if (view === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 animate-fade-in-up">
          <RefreshCw className="w-6 h-6 animate-spin" style={{ color: 'var(--accent-blue)' }} />
          <span className="text-sm font-mono-data" style={{ color: 'var(--text-muted)' }}>
            Fetching node status...
          </span>
        </div>
      </div>
    );
  }

  // No wallet
  if (view === 'no-wallet') {
    return (
      <WalletGate
        connecting={connecting}
        onConnect={connect}
      />
    );
  }

  // Registration form
  if (view === 'register') {
    return (
      <div className="space-y-6 animate-fade-in-up">
        <div>
          <h1
            className="font-mono-data text-xl font-semibold flex items-center gap-2"
            style={{ color: 'var(--text-primary)' }}
          >
            <Cpu className="w-5 h-5" style={{ color: 'var(--accent-blue)' }} />
            Validator Setup — Step 1 of 2
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            No node found for this wallet. Register your node details first.
          </p>
        </div>

        <RegForm
          ownerPubkey={wallet?.publicKey ?? ''}
          registering={registering}
          error={regError}
          onRegister={handleRegister}
        />
      </div>
    );
  }

  // Staking / payment
  if (view === 'stake') {
    return (
      <div className="space-y-6 animate-fade-in-up">
        <div>
          <h1
            className="font-mono-data text-xl font-semibold flex items-center gap-2"
            style={{ color: 'var(--text-primary)' }}
          >
            <Cpu className="w-5 h-5" style={{ color: 'var(--accent-blue)' }} />
            Validator Setup — Step 2 of 2
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Node registered. Stake DPNG to activate your validator.
          </p>
        </div>

        <StakingPayment
          walletBalance={wallet?.balance ?? 0}
          nodePubkey={runner?.node_pubkey ?? ''}
          staking={staking}
          error={stakeError}
          onStake={handleStake}
        />
      </div>
    );
  }

  // Full dashboard
  return (
    <Dashboard
      runner={runner!}
      wallet={{
        publicKey: wallet?.publicKey ?? '',
        balance:   wallet?.balance ?? 0,
        network:   wallet?.network,
        connected: wallet?.connected ?? false,
      }}
      offChainBalance={offChainBalance}
      onChainBalance={onChainBalance}
      pendingTxs={pendingTxs}
      termLines={termLines}
      claiming={claiming}
      claimAlert={claimAlert}
      claimSuccess={claimSuccess}
      onClaim={handleClaim}
      onDeposit={handleDeposit}
      onWithdraw={handleWithdraw}
    />
  );
}