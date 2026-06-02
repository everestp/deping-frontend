import { useMemo } from "react";
import { AnchorProvider, Program, Idl } from "@coral-xyz/anchor";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import idl from "../../idl/deping.json";

// The address is often available in the IDL itself
const PROGRAM_ID = idl.metadata.address;

export const useProgram = () => {
  const { connection } = useConnection();
  const wallet = useAnchorWallet(); // Use useAnchorWallet instead of useWallet

  return useMemo(() => {
    // If the wallet is not connected, useAnchorWallet returns undefined.
    // We return null to indicate the program is not ready.
    if (!wallet) return null;

    const provider = new AnchorProvider(
      connection,
      wallet, // AnchorWallet is fully compatible with AnchorProvider
      { commitment: "confirmed" }
    );

    return new Program(idl as Idl, PROGRAM_ID, provider);
  }, [connection, wallet]);
};
