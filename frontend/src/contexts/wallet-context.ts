import type { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit/stellar-wallets-kit";
import { createContext, useContext } from "react";

export interface WalletContextType {
  kit: StellarWalletsKit | null;
  address: string | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

export const WalletContext = createContext<WalletContextType | undefined>(undefined);


export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
