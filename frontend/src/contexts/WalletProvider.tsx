import { NETWORK } from '@/config';
import { StellarWalletsKit, allowAllModules } from '@creit.tech/stellar-wallets-kit';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { WalletContext } from './wallet-context';

export function WalletProvider({ children }: { children: ReactNode }) {
  const [kit] = useState(() =>
    new StellarWalletsKit({
      network: NETWORK,
      selectedWalletId: 'freighter',
      modules: allowAllModules(),
    })
  );

  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Try to restore previous connection
    const savedAddress = localStorage.getItem('stellar_address');
    if (savedAddress) {
      setAddress(savedAddress);
      setIsConnected(true);
    }
  }, []);

  const connect = async () => {
    try {
      const { address: walletAddress } = await kit.getAddress();
      setAddress(walletAddress);
      setIsConnected(true);
      localStorage.setItem('stellar_address', walletAddress);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  };

  const disconnect = () => {
    setAddress(null);
    setIsConnected(false);
    localStorage.removeItem('stellar_address');
  };

  return (
    <WalletContext.Provider value={{ kit, address, isConnected, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
}
