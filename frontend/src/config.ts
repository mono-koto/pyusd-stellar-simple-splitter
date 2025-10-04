import { Networks } from '@stellar/stellar-sdk';
import { WalletNetwork } from '@creit.tech/stellar-wallets-kit';

export const NETWORK = WalletNetwork.TESTNET;
export const NETWORK_PASSPHRASE = Networks.TESTNET;
export const HORIZON_URL = 'https://horizon-testnet.stellar.org';
export const SOROBAN_RPC_URL = 'https://soroban-testnet.stellar.org';

export const FACTORY_CONTRACT_ID = import.meta.env.VITE_FACTORY_CONTRACT_ID || 'CA4WV3U4KUNIWKGZA6CVLLH33HTJR63LSTTKWEX3SI24FKMHJ7G75LAP';
export const PYUSD_SAC_CONTRACT = import.meta.env.VITE_PYUSD_SAC_CONTRACT || 'CACZL3MGXXP3O6ROMB4Q36ROFULRWD6QARPE3AKWPSWMYZVF2474CBXP';

export const EXPLORER_URL = 'https://stellar.expert/explorer/testnet';
