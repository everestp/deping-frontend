// // ─────────────────────────────────────────────
// // pages/MinerNode.tsx
// // ─────────────────────────────────────────────

// import React, { useState, useEffect, useCallback } from 'react';
// import { RefreshCw, Cpu } from 'lucide-react';
// import { useWallet, useConnection } from '@solana/wallet-adapter-react';
// import { PublicKey } from '@solana/web3.js';
// import { BN } from '@coral-xyz/anchor';

// import { WalletGate } from '../components/miner/WalletGate';
// import { Activate } from '../components/miner/Activate';
// import { RegForm } from '../components/miner/RegForm';
// import { StakingPayment } from '../components/miner/StakingPayment';
// import { Dashboard } from '../components/miner/Dashboard';

// import {
//   getRunnerMe,
//   registerRunner,
//   activateNode,
//   validateStakePayment,
//   validateUnstakePayment,
//   sendHeartbeat,
// } from '../api/node-api';

// import { useProgram } from '../solana/program/anchor-provider';
// import { 
//   getEmailHash, 
//   getNodePDA, 
//   stakeTokens, 
//   withdrawStake, 
//   initNode, 
//   addStake,       // Added
//   deleteAccount   // Added
// } from '../solana/program/breezo.method';
// import { useInterval } from '../hooks/useInterval';

// import type { MinerView, RunnerNode, PendingTx, TerminalLine, RegisterPayload } from '../types/miner';

// const DEEPING_MINT = new PublicKey("DPg3P2U4syj8eGL6rRqMqhUfDayxVunh7Fmcowwh6hsj");
// const TOKEN_DECIMALS = 1_000_000_000;

// export default function MinerNode() {
//   const walletContext = useWallet();
//   const { connected, publicKey } = walletContext;
//   const { connection } = useConnection();
//   const program = useProgram();

//   const [view, setView] = useState<MinerView>('loading');
//   const [runner, setRunner] = useState<RunnerNode | null>(null);
//   const [walletBalance, setWalletBalance] = useState(0);
//   const [staking, setStaking] = useState(false);
//   const [stakeError, setStakeError] = useState<string | null>(null);

//   // ── Balance Sync ─────────────────────────────────────────────
//   const refreshBalances = useCallback(() => {
//     if (!publicKey) return;
//     connection.getParsedTokenAccountsByOwner(publicKey, { mint: DEEPING_MINT })
//       .then((acc) => setWalletBalance(acc.value[0]?.account.data.parsed.info.tokenAmount.uiAmount ?? 0))
//       .catch(console.error);

//     getRunnerMe(publicKey.toBase58()).then((resp) => {
//       if (resp.node) {
//         setRunner(resp.node);
//       }
//     }).catch(() => setView('register'));
//   }, [publicKey, connection]);

//   // ── HANDLER: Add Stake ──
//   const handleAddStake = useCallback(async (amount: number): Promise<string> => {
//     if (!publicKey || !program || !runner) throw new Error('Context missing');
//     const nodePDA = getNodePDA(publicKey, getEmailHash(runner.owner_email));
//     const amountRaw = new BN(amount).mul(new BN(TOKEN_DECIMALS));
    
//     const sig = await addStake(program, nodePDA, amountRaw, walletContext);
//     await connection.confirmTransaction(sig, 'confirmed');
//     refreshBalances();
//     return sig;
//   }, [publicKey, program, runner, walletContext, connection, refreshBalances]);

//   // ── HANDLER: Delete Account ──
//   const handleDeleteAccount = useCallback(async (amount: number): Promise<string> => {
//     if (!publicKey || !program || !runner) throw new Error('Context missing');
//     const nodePDA = getNodePDA(publicKey, getEmailHash(runner.owner_email));
//     const amountRaw = new BN(amount).mul(new BN(TOKEN_DECIMALS));

//     const sig = await deleteAccount(program, nodePDA, amountRaw, walletContext);
//     await connection.confirmTransaction(sig, 'confirmed');
//     refreshBalances();
//     return sig;
//   }, [publicKey, program, runner, walletContext, connection, refreshBalances]);

//   // ── HANDLER: Withdraw/Unstake ──
//   const handleWithdrawStake = useCallback(async (amount: number): Promise<string> => {
//     if (!publicKey || !program || !runner) throw new Error('Context missing');
//     const nodePDA = getNodePDA(publicKey, getEmailHash(runner.owner_email));
    
//     // Assuming withdrawStake service takes (program, nodePDA, wallet)
//     // Note: Update your service if it requires an amount param
//     const sig = await withdrawStake(program, nodePDA, walletContext);
//     await connection.confirmTransaction(sig, 'confirmed');
//     return sig;
//   }, [publicKey, program, runner, walletContext, connection]);

//   // ── HANDLER: Validation Sync ──
//   const handleValidateUnstake = useCallback(async (payload: { signature: string; node_pda: string; amount: number }) => {
//     await validateUnstakePayment({
//       ...payload,
//       amount: Number(new BN(payload.amount).mul(new BN(TOKEN_DECIMALS)))
//     });
//     refreshBalances();
//   }, [refreshBalances]);

//   // ... (Keep existing loading/view logic)

//   return (
//     <Dashboard
//       runner={runner!}
//       wallet={{
//         publicKey: publicKey?.toBase58() ?? '',
//         balance: walletBalance,
//         network: 'devnet',
//         connected: connected,
//       }}
//       // ... pass props ...
//       onStakeMore={handleAddStake}
//       onWithdrawStake={handleWithdrawStake}
//       onDeleteAccount={handleDeleteAccount}
//       validateUnstake={handleValidateUnstake}
//     />
//   );
// }




//   if (view === 'loading') {
//     return (
//       <div className="flex items-center justify-center min-h-[60vh]">
//         <div className="flex flex-col items-center gap-3 animate-fade-in-up">
//           <RefreshCw className="w-6 h-6 animate-spin" style={{ color: 'var(--accent-blue)' }} />
//           <span className="text-sm font-mono-data" style={{ color: 'var(--text-muted)' }}>
//             Fetching node status...
//           </span>
//         </div>
//       </div>
//     );
//   }

//   if (view === 'no-wallet') {
//     return <WalletGate />;
//   }

//   if (view === 'register') {
//     return (
//       <div className="space-y-6 animate-fade-in-up">
//         <div>
//           <h1
//             className="font-mono-data text-xl font-semibold flex items-center gap-2"
//             style={{ color: 'var(--text-primary)' }}
//           >
//             <Cpu className="w-5 h-5" style={{ color: 'var(--accent-blue)' }} />
//             Validator Setup — Step 1 of 3
//           </h1>
//           <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
//             No node found for this wallet. Register your details first.
//           </p>
//         </div>
//         <RegForm
//           ownerPubkey={publicKey!.toBase58()}
//           registering={registering}
//           error={regError}
//           onRegister={handleRegister}
//         />
//       </div>
//     );
//   }

//   if (view === 'activate') {
//     return (
//       <div className="space-y-6 animate-fade-in-up">
//         <div>
//           <h1
//             className="font-mono-data text-xl font-semibold flex items-center gap-2"
//             style={{ color: 'var(--text-primary)' }}
//           >
//             <Cpu className="w-5 h-5" style={{ color: 'var(--accent-blue)' }} />
//             Validator Setup — Step 2 of 3
//           </h1>
//           <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
//             Initialize your node account on-chain.
//           </p>
//         </div>
//         <Activate
//           loading={activating}
//           error={activateError}
//           onActivate={handleActivate}
//         />
//       </div>
//     );
//   }

//   if (view === 'stake') {
//     return (
//       <div className="space-y-6 animate-fade-in-up">
//         <div>
//           <h1
//             className="font-mono-data text-xl font-semibold flex items-center gap-2"
//             style={{ color: 'var(--text-primary)' }}
//           >
//             <Cpu className="w-5 h-5" style={{ color: 'var(--accent-blue)' }} />
//             Validator Setup — Step 3 of 3
//           </h1>
//           <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
//             Stake DPNG tokens to activate your validator status.
//           </p>
//         </div>
//         <StakingPayment
//           walletBalance={walletBalance}
//           nodePubkey={runner?.node_pubkey ?? ''}
//           staking={staking}
//           error={stakeError}
//           onStake={handleStake}
//         />
//       </div>
//     );
//   }