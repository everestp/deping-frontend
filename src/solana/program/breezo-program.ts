import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { Wallet } from "@coral-xyz/anchor/dist/cjs/provider";
// Import the generated type from your Anchor build

import idl from "../../idl/deping.json";

export const getProgram = (connection: Connection, wallet: Wallet) => {
  if (!wallet?.publicKey) return null;

  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });

  // Use the <Deping> generic to provide full type-safety
  return new Program(
    idl ,
    new PublicKey(idl.metadata.address),
    provider
  );
};
