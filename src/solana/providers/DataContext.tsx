import { createContext, useContext, useMemo, ReactNode } from "react";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { Program } from "@coral-xyz/anchor";
import { getProgram, Dep } from "../program/breezo-program"; // Assuming 'Dep' is your IDL type

// 1. Define the shape of your context
interface DataContextState {
  connected: boolean;
  wallet: string | null;
  program: Program<Dep> | null;
}

// 2. Initialize with undefined or a default
export const DataContext = createContext<DataContextState | undefined>(undefined);

interface Props {
  children: ReactNode;
}

export const DataContextProvider = ({ children }: Props) => {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const program = useMemo(() => {
    if (connection && wallet) {
      return getProgram(connection, wallet) as Program<Dep>;
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

// 3. Improve the custom hook with an error check
export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataContextProvider");
  }
  return context;
};