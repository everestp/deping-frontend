import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
    ConnectionProvider,
    WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { useMemo } from "react";

import "@solana/wallet-adapter-react-ui/styles.css";

interface AppWalletProviderProps {
  children: React.ReactNode;
}

const AppWalletProvider: React.FC<AppWalletProviderProps> = ({ children }) => {
  const network = WalletAdapterNetwork.Devnet;
  const HELIUS_API_KEY = process.env.VITE_HELIUS_API_KEY || "70641d42-a106-426c-8064-818bdc324253";

  const endpoint = useMemo(() => {
    return `https://devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
  }, [HELIUS_API_KEY]);

  // ✅ LEAVE THIS EMPTY! 
  // Modern wallet providers automatically inject into the window object.
  // Leaving this empty allows the wrapper hook to detect Phantom/Solflare perfectly without breaking signing capabilities.
  const wallets = useMemo(() => [], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default AppWalletProvider;