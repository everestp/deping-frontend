import { createContext, useContext, useMemo } from "react";

import {
  useAnchorWallet,
  useConnection,
} from "@solana/wallet-adapter-react";

import {  getProgram} from "../program/breezo-program";
// import { mockWallet } from "@/program/mockWallet";

export const DataContext = createContext(null);

export const DataContextProvider = ({ children }) => {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const program = useMemo(() => {
    if (connection && wallet) {
      return getProgram(connection, wallet);
    }

    // fallback (optional)
    // return getProgram(connection, mockWallet());
    return null;
  }, [connection, wallet]);

  const contextValue = {
    connected: !!wallet?.publicKey,
    wallet: wallet?.publicKey?.toString() || null,
    program,
  };

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
};

// Custom Hook
export const useData = () => useContext(DataContext);
