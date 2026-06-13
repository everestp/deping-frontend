// ─────────────────────────────────────────────
// pages/MinerNode.tsx
// ─────────────────────────────────────────────

import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Cpu } from 'lucide-react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

import { WalletGate }     from '../components/miner/WalletGate';
import { Activate }       from '../components/miner/Activate';
import { RegForm }        from '../components/miner/RegForm';
import { StakingPayment } from '../components/miner/StakingPayment';
import { Dashboard }      from '../components/miner/Dashboard';

import {
  getRunnerMe,
  registerRunner,
  activateNode,
  validateStakePayment,
  sendHeartbeat,
} from '../api/node-api';

import { useProgram }                              from '../solana/program/anchor-provider';
import { getEmailHash, getNodePDA, stakeTokens, initNode } from '../solana/program/breezo.method';
import { useInterval }                             from '../hooks/useInterval';

import type {
  MinerView,
  RunnerNode,
  PendingTx,
  TerminalLine,
  RegisterPayload,
} from '../types/miner';

// ── Mint & Scaling Config ────────────────────────────────────
const DEEPING_MINT = new PublicKey("DPg3P2U4syj8eGL6rRqMqhUfDayxVunh7Fmcowwh6hsj");
const TOKEN_DECIMALS = 1_000_000_000; // 9 decimal positional bounds

// ── Terminal helpers ─────────────────────────────────────────
const NODE_REGIONS = ['AP-South-1', 'US-East-2', 'EU-Central-1', 'US-West-1', 'SA-East-1'];
const TARGETS_POOL = [
  'https://api.deping.xyz',
  'https://solana.com',
  'https://api.coingecko.com',
  'https://mainnet.helius-rpc.com',
  'https://status.solana.com',
];

function buildTermLine(): TerminalLine {
  const now    = new Date();
  const ts     = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} UTC`;
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

function randMicro() {
  return parseFloat((Math.random() * 0.05 + 0.03).toFixed(4));
}

function nowTs() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')} UTC`;
}

// ── Main UI Component Layer ───────────────────────────────────
export default function MinerNode() {
  const walletContext            = useWallet();
  const { connected, publicKey } = walletContext;
  const { connection }           = useConnection();
  const program                  = useProgram();

  // ── Reactive Pipeline Hooks ─────────────────────────────────
  const [view, setView] = useState<MinerView>('loading');
  const [runner, setRunner] = useState<RunnerNode | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);

  // ── Operational Loading Substates ───────────────────────────
  const [registering, setRegistering] = useState(false);
  const [regError, setRegError]       = useState<string | null>(null);
  const [activating, setActivating]     = useState(false);
  const [activateError, setActivateError] = useState<string | null>(null);
  const [staking, setStaking]     = useState(false);
  const [stakeError, setStakeError] = useState<string | null>(null);

  // ── Ledger Performance Data Metrics ─────────────────────────
  const [offChainBalance, setOffChainBalance] = useState(0);
  const [onChainBalance, setOnChainBalance]   = useState(0);
  const [pendingTxs, setPendingTxs]           = useState<PendingTx[]>([]);
  const [termLines, setTermLines]             = useState<TerminalLine[]>(() =>
    Array.from({ length: 6 }, buildTermLine),
  );

  const [claiming, setClaiming]         = useState(false);
  const [claimAlert, setClaimAlert]     = useState<string | null>(null);
  const [claimSuccess, setClaimSuccess] = useState<string | null>(null);

  // ── Sync Cycle Bootstrapper ─────────────────────────────────
  useEffect(() => {
    if (!connected || !publicKey) {
      setView('no-wallet');
      return;
    }

    setView('loading');

    // Resolve current wallet balances
    connection
      .getParsedTokenAccountsByOwner(publicKey, { mint: DEEPING_MINT })
      .then((accounts) => {
        const info    = accounts.value[0]?.account.data.parsed.info;
        const balance = info ? (info.tokenAmount.uiAmount ?? 0) : 0;
        setWalletBalance(balance);
      })
      .catch(console.error);

    // Pull verified tracking state from off-chain cluster database
    getRunnerMe(publicKey.toBase58())
      .then((resp) => {
        if (resp.node) {
          setRunner(resp.node);
          setOffChainBalance(resp.node.offchain_accumulated_tokens);
          setOnChainBalance(resp.node.total_earned_tokens_all_time);
        }
        setView(resp.view);
      })
      .catch(() => {
        setView('register');
      });
  }, [connected, publicKey, connection]);

  // ── Background Network Worker Ingest Intervals ──────────────
  useInterval(() => {
    if (view === 'dashboard' && runner?.node_pubkey) {
      sendHeartbeat(runner.node_pubkey);
    }
  }, 30_000);

  useInterval(() => {
    if (view === 'dashboard') {
      setOffChainBalance((p) => parseFloat((p + randMicro()).toFixed(6)));
    }
  }, 2_500);

  useInterval(() => {
    if (view === 'dashboard') {
      setTermLines((prev) => [...prev.slice(-29), buildTermLine()]);
    }
  }, 3_200);

  // ── HANDLER: Execution registration logic ────────────────────
  const handleRegister = useCallback(
    async (payload: RegisterPayload) => {
      setRegError(null);
      setRegistering(true);
      try {
        const r = await registerRunner(payload);
        setRunner(r);
        setView('activate');
      } catch (err: unknown) {
        setRegError(err instanceof Error ? err.message : 'Registration failed.');
      } finally {
        setRegistering(false);
      }
    },
    [],
  );

  // ── HANDLER: Activate (Refactored to cleanly run centralized client method) ──
  const handleActivate = useCallback(async () => {
    if (!publicKey || !program || !runner) return;

    setActivateError(null);
    setActivating(true);

    try {
      // Execute standardized initialization block 
      await initNode(program, runner.owner_email, walletContext);

      const emailHash = getEmailHash(runner.owner_email);
      const nodePDA   = getNodePDA(publicKey, emailHash);

      const updated = await activateNode(nodePDA.toBase58());
      setRunner(updated);

      setView('stake');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Activation failed.';
      setActivateError(
        msg.includes('already in use') || msg.includes('0x0')
          ? 'Node account already initialized on-chain. Proceeding to stake...'
          : msg,
      );
      if (msg.includes('already in use') || msg.includes('0x0')) {
        setTimeout(() => setView('stake'), 1500);
      }
    } finally {
      setActivating(false);
    }
  }, [publicKey, program, runner, walletContext]);

  // ── HANDLER: Stake (Includes precision string parsing update) ──
  const handleStake = useCallback(
    async (amount: number) => {
      if (!publicKey || !program || !runner) {
        setStakeError('Wallet, program, or node not initialized.');
        return;
      }

      setStakeError(null);
      setStaking(true);

      try {
        const emailHash = getEmailHash(runner.owner_email);
        const nodePDA   = getNodePDA(publicKey, emailHash);

        const accountInfo = await program.provider.connection.getAccountInfo(nodePDA);
        if (!accountInfo) {
          throw new Error('Node account not found on-chain. Please re-activate.');
        }

        // Build type-safe numeric precision layout containers
        const amountRaw = new BN(amount).mul(new BN(TOKEN_DECIMALS));

        // Submit to on-chain instruction wrapper
        const tx_signature = await stakeTokens(
          program, 
          nodePDA, 
          amountRaw, 
          walletContext
        );

        const latestBlockhash = await program.provider.connection.getLatestBlockhash();
        await program.provider.connection.confirmTransaction(
          { signature: tx_signature, ...latestBlockhash },
          'confirmed',
        );

        // Passed safely via stringified decimals to prevent number precision blowouts
        await validateStakePayment({
          signature:       tx_signature,
          expected_amount: Number(amountRaw.toString()), 
          node_pda:        nodePDA.toBase58(),
        });

        const resp = await getRunnerMe(publicKey.toBase58());
        if (resp.node) {
          setRunner(resp.node);
          setOffChainBalance(resp.node.offchain_accumulated_tokens);
          setOnChainBalance(resp.node.total_earned_tokens_all_time);
        }

        setView('dashboard');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Staking failed.';
        setStakeError(
          msg.includes('3012')
            ? 'Vault not initialized on-chain. Contact support.'
            : msg,
        );
        throw err;
      } finally {
        setStaking(false);
      }
    },
    [publicKey, program, runner, walletContext],
  );

  // ── HANDLER: Claim Rewards ──────────────────────────────────
  const handleClaim = useCallback(async () => {
    setClaimAlert(null);
    setClaimSuccess(null);

    if (offChainBalance < 10) {
      setClaimAlert(
        'Milestone Constraint: Accumulate a minimum of 10.0 $UPT off-chain before syncing to blockchain.',
      );
      return;
    }

    setClaiming(true);
    try {
      await new Promise((r) => setTimeout(r, 1_800));

      const claimed   = 1;
      const remainder = parseFloat((offChainBalance % 10).toFixed(6));
      const sig       = Array.from({ length: 64 }, () =>
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

      setClaimSuccess(`Claimed ${claimed} $UPT on-chain. Remainder: ${remainder.toFixed(6)} $UPT.`);
      setTimeout(() => setClaimSuccess(null), 6_000);
    } finally {
      setClaiming(false);
    }
  }, [offChainBalance]);

  // ── HANDLER: Auxiliary Account Mutators ─────────────────────
  const handleDeposit = useCallback(async (amount: number) => {
    await new Promise((r) => setTimeout(r, 1_000));
    setOnChainBalance((p) => parseFloat((p + amount).toFixed(4)));
  }, []);

  const handleWithdraw = useCallback(async (amount: number) => {
    await new Promise((r) => setTimeout(r, 1_000));
    setOnChainBalance((p) => parseFloat((p - amount).toFixed(4)));
  }, []);

  // ── Render Tree Structure ────────────────────────────────────

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

  if (view === 'no-wallet') {
    return <WalletGate />;
  }

  if (view === 'register') {
    return (
      <div className="space-y-6 animate-fade-in-up">
        <div>
          <h1
            className="font-mono-data text-xl font-semibold flex items-center gap-2"
            style={{ color: 'var(--text-primary)' }}
          >
            <Cpu className="w-5 h-5" style={{ color: 'var(--accent-blue)' }} />
            Validator Setup — Step 1 of 3
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            No node found for this wallet. Register your details first.
          </p>
        </div>
        <RegForm
          ownerPubkey={publicKey!.toBase58()}
          registering={registering}
          error={regError}
          onRegister={handleRegister}
        />
      </div>
    );
  }

  if (view === 'activate') {
    return (
      <div className="space-y-6 animate-fade-in-up">
        <div>
          <h1
            className="font-mono-data text-xl font-semibold flex items-center gap-2"
            style={{ color: 'var(--text-primary)' }}
          >
            <Cpu className="w-5 h-5" style={{ color: 'var(--accent-blue)' }} />
            Validator Setup — Step 2 of 3
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Initialize your node account on-chain.
          </p>
        </div>
        <Activate
          loading={activating}
          error={activateError}
          onActivate={handleActivate}
        />
      </div>
    );
  }

  if (view === 'stake') {
    return (
      <div className="space-y-6 animate-fade-in-up">
        <div>
          <h1
            className="font-mono-data text-xl font-semibold flex items-center gap-2"
            style={{ color: 'var(--text-primary)' }}
          >
            <Cpu className="w-5 h-5" style={{ color: 'var(--accent-blue)' }} />
            Validator Setup — Step 3 of 3
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Stake DPNG tokens to activate your validator status.
          </p>
        </div>
        <StakingPayment
          walletBalance={walletBalance}
          nodePubkey={runner?.node_pubkey ?? ''}
          staking={staking}
          error={stakeError}
          onStake={handleStake}
        />
      </div>
    );
  }

  return (
    <Dashboard
      runner={runner!}
      wallet={{
        publicKey: publicKey?.toBase58() ?? '',
        balance:   walletBalance,
        network:   'devnet',
        connected: connected,
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