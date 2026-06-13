import { useMemo } from "react";
import { AnchorProvider, Program, Idl } from "@coral-xyz/anchor";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import idl from "../../idl/deping.json";

const PROGRAM_ID = idl.metadata.address;

export const useProgram = () => {
  const { connection } = useConnection();
  const wallet = useAnchorWallet(); 

  return useMemo(() => {
    // 🔥 THE FIX: Create a safe dummy fallback wallet structure 
    // instead of returning null. This keeps the Program object initialized 
    // for read-only actions and hot-swaps instantly when connected.
    const activeWallet = wallet || {
      publicKey: PublicKey.default,
      signAllTransactions: async (txs: any) => txs,
      signTransaction: async (tx: any) => tx,
    };

    const provider = new AnchorProvider(
      connection,
      activeWallet, 
      { commitment: "confirmed" }
    );

    return new Program(idl as Idl, PROGRAM_ID, provider);
  }, [connection, wallet]); // Re-runs instantly the moment useAnchorWallet updates
};