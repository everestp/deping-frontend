import { useMemo } from "react";
import { AnchorProvider, Program, Idl } from "@coral-xyz/anchor";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import idl from "../idl/deping.json";

// Define the Program type using your IDL
// Replacing 'any' with the specific IDL type improves IDE autocompletion
const PROGRAM_ID = idl.metadata.address;

export const useProgram = () => {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();

  return useMemo(() => {
    // If the wallet is not connected, return null for the program
    if (!wallet) return { program: null };

    const provider = new AnchorProvider(
      connection,
      wallet,
      { commitment: "confirmed" }
    );

    const program = new Program(idl as Idl, PROGRAM_ID, provider);

    return { program };
  }, [wallet, connection]);
};
