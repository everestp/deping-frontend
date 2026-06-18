import { createContext, useCallback, useContext, useState } from 'react';

interface WalletState {
  connected: boolean;
  publicKey: string | null;
  balance: number;
  network: 'mainnet-beta' | 'devnet' | 'testnet';
}

interface SolanaWalletContextValue {
  wallet: WalletState;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  truncatedKey: string | null;
  signTransaction: (payload: string) => Promise<{ signature: string }>;
}

const SolanaWalletContext = createContext<SolanaWalletContextValue | null>(null);

const MOCK_PUBLIC_KEYS = [
  '6xR4mKpJfBqW3uNtYvH8sDcLzA2e5iT7oP9ZpL',
  '9mWxRkL4PnBqVs2HtAeNjC7gDf3Yi8uZ1oM5Kp',
  '3pTvQnK8BrWj5mH2sDaLxE6cIo9YgNf4Zu7X1eR',
];

function generateSignature(): string {
  return Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

export function SolanaWalletProvider({ children }: { children: React.ReactNode }) {
  const [wallet, setWallet] = useState<WalletState>({
    connected: false,
    publicKey: null,
    balance: 0,
    network: 'devnet',
  });
  const [connecting, setConnecting] = useState(false);

  const connect = useCallback(async () => {
    setConnecting(true);
    await new Promise((r) => setTimeout(r, 1200));

    const storedKey = localStorage.getItem('dp_wallet_key');
    const key = storedKey || MOCK_PUBLIC_KEYS[Math.floor(Math.random() * MOCK_PUBLIC_KEYS.length)];
    const balance = parseFloat((Math.random() * 45 + 5).toFixed(4));

    if (!storedKey) localStorage.setItem('dp_wallet_key', key);

    setWallet({ connected: true, publicKey: key, balance, network: 'devnet' });
    setConnecting(false);
  }, []);

  const disconnect = useCallback(() => {
    setWallet({ connected: false, publicKey: null, balance: 0, network: 'devnet' });
  }, []);

  const signTransaction = useCallback(async (_payload: string) => {
    await new Promise((r) => setTimeout(r, 800));
    return { signature: generateSignature() };
  }, []);

  const truncatedKey = wallet.publicKey
    ? `${wallet.publicKey.slice(0, 4)}...${wallet.publicKey.slice(-4)}`
    : null;

  return (
    <SolanaWalletContext.Provider value={{ wallet, connecting, connect, disconnect, truncatedKey, signTransaction }}>
      {children}
    </SolanaWalletContext.Provider>
  );
}

export function useSolanaWallet() {
  const ctx = useContext(SolanaWalletContext);
  if (!ctx) throw new Error('useSolanaWallet must be used within SolanaWalletProvider');
  return ctx;
}
