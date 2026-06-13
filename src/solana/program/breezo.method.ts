import { BN, Program } from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { sha256 } from "js-sha256";

// =====================================================
// GLOBAL SETUP
// =====================================================
const PROGRAM_ID = new PublicKey("DVicVozhh4y38dA6iCzfPp2c4xj5Q29mJq6HgF5Eufiz");
const DEEPING_MINT = new PublicKey("DPg3P2U4syj8eGL6rRqMqhUfDayxVunh7Fmcowwh6hsj");

// =====================================================
// UTILITY HELPERS (PDA & HASH)
// =====================================================
export const getStakingVaultAuthority = () =>
  PublicKey.findProgramAddressSync([Buffer.from("staking_vault")], PROGRAM_ID)[0];

export const getTreasuryAuthority = () =>
  PublicKey.findProgramAddressSync([Buffer.from("treasury")], PROGRAM_ID)[0];

export const getNodePDA = (owner: PublicKey, emailHash: Uint8Array) =>
  PublicKey.findProgramAddressSync([Buffer.from("node"), owner.toBuffer(), emailHash], PROGRAM_ID)[0];

export const getEmailHash = (email: string): Uint8Array =>
  new Uint8Array(sha256.array(email.toLowerCase().trim()));

/**
 * Universal safe parser to pull the valid signing PublicKey from any adapter framework
 */
const parseWalletPubKey = (wallet: any): PublicKey => {
  const pk = wallet?.publicKey || wallet?.adapter?.publicKey || wallet?.wallet?.adapter?.publicKey;
  if (!pk) throw new Error("Wallet connection missing. Make sure your wallet is connected.");
  return pk;
};

// =====================================================
// 🚀 ON-CHAIN METHODS (SIMPLIFIED & HARDENED)
// =====================================================

/**
 * INIT NODE — Registers and establishes the node data account on-chain
 */
export const initNode = async (program: Program<any>, email: string, wallet: any) => {
  const owner = parseWalletPubKey(wallet);
  const emailHash = getEmailHash(email);
  const nodeAccount = getNodePDA(owner, emailHash);

  return await program.methods
    .initNode(Array.from(emailHash))
    .accounts({
      nodeAccount,
      owner,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
};

/**
 * STAKE TOKENS — Fully automated using Anchor's clean transaction engine
 */
export const stakeTokens = async (
  program: Program<any>,
  nodeAccount: PublicKey,
  amount: BN,
  wallet: any
) => {
  const owner = parseWalletPubKey(wallet);
  const stakingVaultAuthority = getStakingVaultAuthority();

  // Derive Associated Token Accounts (ATAs) 
  const userTokenAccount = await getAssociatedTokenAddress(DEEPING_MINT, owner);
  const stakingVault = await getAssociatedTokenAddress(DEEPING_MINT, stakingVaultAuthority, true);

  // Anchor's .rpc() pattern natively manages latest blockhashes, token account 
  // auto-creation constraints via the IDL, fee configuration, and standard client prompts.
  return await program.methods
    .stakeTokens(amount)
    .accounts({
      nodeAccount,
      userTokenAccount,
      stakingVault,
      owner,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();
};

/**
 * WITHDRAW STAKE — Recovers staked tokens from vault after cooldown cycles finish
 */
export const withdrawStake = async (program: Program<any>, nodeAccountAddress: PublicKey, wallet: any) => {
  const owner = parseWalletPubKey(wallet);
  const stakingVaultAuthority = getStakingVaultAuthority();

  const userTokenAccount = await getAssociatedTokenAddress(DEEPING_MINT, owner);
  const stakingVault = await getAssociatedTokenAddress(DEEPING_MINT, stakingVaultAuthority, true);

  return await program.methods
    .withdrawStake()
    .accounts({
      nodeAccount: nodeAccountAddress,
      userTokenAccount,
      stakingVault,
      stakingVaultAuthority,
      owner,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();
};