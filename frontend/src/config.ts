import { Networks } from '@stellar/stellar-sdk';
import { WalletNetwork } from '@creit.tech/stellar-wallets-kit';

export const NETWORK = WalletNetwork.TESTNET;
export const NETWORK_PASSPHRASE = Networks.TESTNET;
export const HORIZON_URL = 'https://horizon-testnet.stellar.org';
export const SOROBAN_RPC_URL = 'https://soroban-testnet.stellar.org';

export const FACTORY_CONTRACT_ID = import.meta.env.VITE_FACTORY_CONTRACT_ID;
export const PYUSD_SAC_CONTRACT = import.meta.env.VITE_PYUSD_SAC_CONTRACT;

if (!FACTORY_CONTRACT_ID) {
  throw new Error('VITE_FACTORY_CONTRACT_ID is not set in the environment variables');
}

if (!PYUSD_SAC_CONTRACT) {
  throw new Error('VITE_PYUSD_SAC_CONTRACT is not set in the environment variables');
}

export const EXPLORER_URL = 'https://stellar.expert/explorer/testnet';
