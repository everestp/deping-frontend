import { createContext, useContext, useMemo, ReactNode } from "react";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { Program, Idl } from "@coral-xyz/anchor";
import { getProgram } from "../program/breezo-program";

// 1. Define the shape of your context
// We use 'Idl' as a generic fallback since you don't have the generated 'Dep' type
interface DataContextState {
  connected: boolean;
  wallet: string | null;
  program: Program<Idl> | null;
}

// 2. Initialize with undefined
export const DataContext = createContext<DataContextState | undefined>(undefined);

interface Props {
  children: ReactNode;
}

export const DataContextProvider = ({ children }: Props) => {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const program = useMemo(() => {
    if (connection && wallet) {
      // Casting to Program<Idl> works as a generic placeholder
      return getProgram(connection, wallet) as Program<Idl>;
    }
    return null;
  }, [connection, wallet]);

  const contextValue: DataContextState = {
    connected: !!wallet?.publicKey,
    wallet: wallet?.publicKey?.toBase58() || null,
    program,
  };

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
};

// 3. Custom hook with error check
export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataContextProvider");
  }
  return context;
};