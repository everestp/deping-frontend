// ─────────────────────────────────────────────
// pages/MinerNode.tsx
// ─────────────────────────────────────────────

import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Cpu } from 'lucide-react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

import { WalletGate } from '../components/miner/WalletGate';
import { Activate } from '../components/miner/Activate';
import { RegForm } from '../components/miner/RegForm';
import { StakingPayment } from '../components/miner/StakingPayment';
import { MinerDashboard } from '../components/miner/MinerDashBoard';

import {
  getRunnerMe, registerRunner, activateNode,
  validateStakePayment, validateUnstakePayment, sendHeartbeat,
  validateDelete,
} from '../api/node-api';

import { useProgram } from '../solana/program/anchor-provider';
import { 
  getEmailHash, getNodePDA, initNode, stakeTokens, 
  withdrawStake, addStake, deleteAccount, claimReward // 🌟 Ensure claimReward is explicitly imported here
} from '../solana/program/breezo.method';
import { useInterval } from '../hooks/useInterval';

import type { MinerView, RunnerNode, PendingTx, TerminalLine, RegisterPayload } from '../types/miner';

const DEEPING_MINT = new PublicKey("DPg3P2U4syj8eGL6rRqMqhUfDayxVunh7Fmcowwh6hsj");
const TOKEN_DECIMALS = 1_000_000_000;

export default function MinerNode() {
  const walletContext = useWallet();
  const { connected, publicKey } = walletContext;
  const { connection } = useConnection();
  const program = useProgram();

  const [view, setView] = useState<MinerView>('loading');
  const [runner, setRunner] = useState<RunnerNode | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [stakeBalance, setStakeBalance] = useState(0);
  const [onChainRewardBalance, setOnChainRewardBalance] = useState(0);
  const [staking, setStaking] = useState(false);
  const [stakeError, setStakeError] = useState<string | null>(null);
  const [offChainBalance, setOffChainBalance] = useState(0);
  const [pendingTxs, setPendingTxs] = useState<PendingTx[]>([]);
  const [termLines, setTermLines] = useState<TerminalLine[]>([]);
  const [claiming, setClaiming] = useState(false);
  const [claimAlert, setClaimAlert] = useState<string | null>(null);
  const [claimSuccess, setClaimSuccess] = useState<string | null>(null);

  const refreshBalances = useCallback(async () => {
    if (!publicKey || !program) return;
    try {
      // 1. Fetch Wallet Balance
      const acc = await connection.getParsedTokenAccountsByOwner(publicKey, { mint: DEEPING_MINT });
      setWalletBalance(acc.value[0]?.account.data.parsed.info.tokenAmount.uiAmount ?? 0);

      // 2. Fetch Runner/Node Info
      const resp = await getRunnerMe(publicKey.toBase58());
      
      if (resp.node) {
        setRunner(resp.node);
        
        // Update Off-Chain Rewards / Points
        setOffChainBalance(resp.node.offchain_accumulated_tokens);
        
        // Fetch On-Chain State directly from PDA
        try {
          const nodePDA = getNodePDA(publicKey, getEmailHash(resp.node.owner_email));
          const accountData = await program.account.nodeAccount.fetch(nodePDA);
          
          const readableStaked = new BN(accountData.stakedAmount).toNumber() / TOKEN_DECIMALS;
          const readableOnchainRewardBalance = new BN(accountData.rewardBalance).toNumber() / TOKEN_DECIMALS;
          
          console.log("On-chain reward balance (readable):", readableOnchainRewardBalance);
          
          setStakeBalance(readableStaked);
          setOnChainRewardBalance(readableOnchainRewardBalance); // 🌟 Sets properties accurately for TypeScript layout satisfaction
        } catch (e) {
          console.warn("PDA fetch failed:", e);
        }
      }
      if (resp.view) setView(resp.view);
    } catch (error) { 
      setView('register'); 
    }
  }, [publicKey, connection, program]);

  useEffect(() => {
    if (!connected || !publicKey) { setView('no-wallet'); return; }
    refreshBalances();
  }, [connected, publicKey, refreshBalances]);

  // ── HANDLERS ─────────────────────────────────────────────
  
  // 🌟 LIVE CLAIM ACTION: Handles full on-chain Anchor method call sequence
  const handleClaimRewards = async () => {
    if (!program || !publicKey || !runner) return;
    
    setClaiming(true);
    setClaimAlert(null);
    setClaimSuccess(null);

    try {
      const nodePDA = getNodePDA(publicKey, getEmailHash(runner.owner_email));
      
      // Re-fetch fresh account snapshot to secure precise raw token counts
      const accountData = await program.account.nodeAccount.fetch(nodePDA);
      const amountRaw = new BN(accountData.rewardBalance);

      if (amountRaw.isZero()) {
        setClaimAlert("No active on-chain rewards detected to finalize claim execution.");
        setClaiming(false);
        return;
      }

      // Execute on-chain smart contract settlement process
      const sig = await claimReward(program, nodePDA, amountRaw, walletContext);
      await connection.confirmTransaction(sig, 'confirmed');

      setClaimSuccess(`Claim processed successfully! Signature: ${sig.slice(0, 8)}...`);
      
      // Refresh balance states to immediately update display counters
      await refreshBalances();
    } catch (err: any) {
      console.error("Claim Transaction Execution Error:", err);
      setClaimAlert(err?.message || "On-chain transaction execution failed.");
    } finally {
      setClaiming(false);
    }
  };

  const handleStake = async (amount: number): Promise<string> => {
    const nodePDA = getNodePDA(publicKey!, getEmailHash(runner!.owner_email));
    const amountRaw = new BN(amount).mul(new BN(TOKEN_DECIMALS));
    const sig = await stakeTokens(program!, nodePDA, amountRaw, walletContext);
    await connection.confirmTransaction(sig, 'confirmed');
    await validateStakePayment({ signature: sig, expected_amount: Number(amountRaw), node_pda: nodePDA.toBase58() ,public_key:publicKey?.toBase58() });
    refreshBalances();
    return sig;
  };

  const handleAddStake = async (amount: number): Promise<string> => {
    const nodePDA = getNodePDA(publicKey!, getEmailHash(runner!.owner_email));
    const amountRaw = new BN(Math.round(amount * TOKEN_DECIMALS));
    
    const sig = await addStake(program!, nodePDA, amountRaw, walletContext);
    await connection.confirmTransaction(sig, 'finalized');

    // 25-second indexing allocation delay for backend sync engines
    await new Promise((resolve) => setTimeout(resolve, 25000));

    await validateStakePayment({ 
      signature: sig, 
      expected_amount: Number(amountRaw.toString()), 
      node_pda: nodePDA.toBase58(), 
      public_key: publicKey?.toBase58() 
    });
    
    refreshBalances();
    return sig;
  };

  const handleWithdrawStake = async (amount: number): Promise<string> => {
    const nodePDA = getNodePDA(publicKey!, getEmailHash(runner!.owner_email));
    const amountRaw = new BN(Math.round(amount * TOKEN_DECIMALS)); 

    const sig = await withdrawStake(program!, nodePDA, amountRaw, walletContext);
    await connection.confirmTransaction(sig, 'confirmed');
    
    await new Promise((resolve) => setTimeout(resolve, 25000));
    await validateUnstakePayment({ 
      signature: sig, 
      expected_amount: Number(amountRaw.toString()), 
      node_pda: nodePDA.toBase58(), 
      public_key: publicKey?.toBase58() 
    });

    refreshBalances();
    return sig;
  };

  const handleDeleteAccount = async (amount: number): Promise<string> => {
    const nodePDA = getNodePDA(publicKey!, getEmailHash(runner!.owner_email));
    const amountRaw = new BN(Math.round(amount * TOKEN_DECIMALS)); 
    const sig = await deleteAccount(program!, nodePDA, amountRaw, walletContext);
    await connection.confirmTransaction(sig, 'finalized');
    await validateDelete({ node_pda:nodePDA.toBase58(),public_key:publicKey?.toBase58()});
    refreshBalances();
    return sig;
  };

  const handleValidateUnstake = async (payload: { signature: string; node_pda: string; amount: number }) => {
    await validateUnstakePayment({ ...payload, expected_amount: Number(new BN(payload.amount).mul(new BN(TOKEN_DECIMALS))) });
    refreshBalances();
  };

  // ── RENDER ───────────────────────────────────────────────
  if (view === 'loading') return <div className="flex justify-center p-10"><RefreshCw className="animate-spin" /></div>;
  if (view === 'no-wallet') return <WalletGate />;
  if (view === 'register') return <RegForm ownerPubkey={publicKey!.toBase58()} registering={false} error={null} onRegister={async (p) => { setRunner(await registerRunner(p)); setView('activate'); }} />;
  if (view === 'activate') return <Activate loading={false} error={null} onActivate={async () => { await initNode(program!, runner!.owner_email, walletContext); setView('stake'); }} />;
  if (view === 'stake') return <StakingPayment walletBalance={walletBalance} nodePubkey={runner?.node_pubkey ?? ''} staking={staking} error={stakeError} onStake={handleAddStake} />;

  return (
    <MinerDashboard
      runner={runner!}
      wallet={{ publicKey: publicKey?.toBase58() ?? '', balance: walletBalance, network: 'devnet', connected: true }}
      offChainBalance={offChainBalance}
      onChainRewardBalance={onChainRewardBalance}
      onChainBalance={onChainRewardBalance} // 🌟 Correct parameter identifier matching the interface definition
      stakeBalance={stakeBalance}
      pendingTxs={pendingTxs}
      termLines={termLines}
      claiming={claiming}
      claimAlert={claimAlert}
      claimSuccess={claimSuccess}
      onClaim={handleClaimRewards} // 🌟 Now correctly fires the real smart contract instruction hook
      onStakeMore={handleAddStake}
      onWithdrawStake={handleWithdrawStake}
      onDeleteAccount={handleDeleteAccount}
      validateUnstake={handleValidateUnstake}
    />
  );
}