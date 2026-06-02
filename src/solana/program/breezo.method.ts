import { PublicKey, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";
import BN from "bn.js";
import { sha256 } from 'js-sha256';

// =====================================================
// CONFIG
// =====================================================
const PROGRAM_ID = new PublicKey("EA4pKJ33F2p4oQyKNcCGMBptjSgbHQzCz2H8QgHbYAgR");
const DEEPING_MINT = new PublicKey("2V5HdggYQXW1Z9nhrVKjNdYqg5NsQnZhwMERYr8WK1pU");

// =====================================================
// PDA HELPERS
// =====================================================

export const getTreasuryPDA = () =>
  PublicKey.findProgramAddressSync([Buffer.from("treasury")], PROGRAM_ID)[0];

export const getStakingVaultPDA = () =>
  PublicKey.findProgramAddressSync([Buffer.from("staking_vault")], PROGRAM_ID)[0];

export const getNodePDA = (ownerPubkey: PublicKey, emailHash: Uint8Array) =>
  PublicKey.findProgramAddressSync(
    [Buffer.from("node"), ownerPubkey.toBuffer(), emailHash],
    PROGRAM_ID
  )[0];

// =====================================================
// INTERFACE: CLAIM REWARD
// =====================================================
export const claimReward = async (
  program: any,
  nodeAccountAddress: PublicKey,
  ownerPublicKey: PublicKey,
  amount: BN
) => {
  const treasuryAuthority = getTreasuryPDA();

  const treasuryTokenAccount = getAssociatedTokenAddressSync(
    DEEPING_MINT,
    treasuryAuthority,
    true
  );

  const userTokenAccount = getAssociatedTokenAddressSync(
    DEEPING_MINT,
    ownerPublicKey
  );

  return await program.methods
    .claimReward(amount)
    .accounts({
      nodeAccount: nodeAccountAddress,
      owner: ownerPublicKey,
      mint: DEEPING_MINT,
      treasuryTokenAccount,
      treasuryAuthority,
      userTokenAccount,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();
};

// =====================================================
// INTERFACE: STAKING
// =====================================================
export const getStakingVaultAuthority = (programId: PublicKey) => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("staking_vault")],
    programId
  )[0];
};
export const stakeTokens = async (
  program: any,
  nodeAccountAddress: PublicKey,
  ownerPublicKey: PublicKey,
  amount: BN
) => {
  // 1. Derive the PDA Authority (The "signer" seeds)
  const stakingVaultAuthority = getStakingVaultAuthority(program.programId);

  // 2. Derive the actual Token Account (The "container" for tokens)
  // This must match the address created by your initialization script
  const stakingVault = getAssociatedTokenAddressSync(
    DEEPING_MINT,
    stakingVaultAuthority,
    true // allowOwnerOffCurve = true, because it's a PDA
  );

  const userTokenAccount = getAssociatedTokenAddressSync(DEEPING_MINT, ownerPublicKey);

  return await program.methods
    .stakeTokens(amount)
    .accounts({
      nodeAccount: nodeAccountAddress,
      owner: ownerPublicKey,
      userTokenAccount: userTokenAccount,
      stakingVault: stakingVault,               // The Token Account (initialized)
      stakingVaultAuthority: stakingVaultAuthority, // The PDA (the authority)
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();
};

export const withdrawStake = async (
  program: any,
  nodeAccountAddress: PublicKey,
  ownerPublicKey: PublicKey
) => {
  const stakingVault = getStakingVaultPDA();
  const userTokenAccount = getAssociatedTokenAddressSync(DEEPING_MINT, ownerPublicKey);

  return await program.methods
    .withdrawStake()
    .accounts({
      nodeAccount: nodeAccountAddress,
      owner: ownerPublicKey,
      stakingVault,
      stakingVaultAuthority: stakingVault,
      userTokenAccount,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();
};


export const getEmailHash = (email: string): Uint8Array => {
  // 1. MUST use the same normalization as your Go backend
  const normalizedEmail = email.toLowerCase().trim();

  // 2. Hash the normalized string
  return new Uint8Array(sha256.array(normalizedEmail));
};

// =====================================================
// INTERFACE: INIT NODE
// =====================================================
export const initNode = async (
  program: any,
  ownerPublicKey: PublicKey,
  email: string
) => {
  const emailHash = getEmailHash(email);
  const nodeAccount = getNodePDA(ownerPublicKey, emailHash);

  // Note: The authority must be your Backend Hot Wallet signer
  // This usually implies your backend calls this or the user provides
  // the backend's signed transaction context.
  return await program.methods
    .initNode(Array.from(emailHash))
    .accounts({
      nodeAccount,
      authority: program.provider.wallet.publicKey, // Must be BACKEND_WALLET
      owner: ownerPublicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
};
