import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { Wallet } from "@coral-xyz/anchor/dist/cjs/provider";
import { Connection, PublicKey } from "@solana/web3.js";
import idl from "../../idl/deping.json";

// Centralized programmatic fallback to secure construction bounds
const PROGRAM_ID = new PublicKey(idl.metadata?.address || "DVicVozhh4y38dA6iCzfPp2c4xj5Q29mJq6HgF5Eufiz");

export const getProgram = (connection: Connection, wallet: Wallet) => {
  // Defensive check: ensure wallet is connected AND possesses signing capabilities
  if (!wallet?.publicKey || !wallet?.signTransaction) {
    return null;
  }

  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });

  // Returns your type-safe, authenticated transaction pipeline
  return new Program(
    idl as any,
    PROGRAM_ID,
    provider
  );
};