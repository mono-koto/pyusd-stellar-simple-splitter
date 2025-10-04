import {
  Contract,
  TransactionBuilder,
  BASE_FEE,
  Address,
  nativeToScVal,
  scValToNative,
  rpc,
  Account,
} from '@stellar/stellar-sdk';
import type { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit';
import { NETWORK_PASSPHRASE, SOROBAN_RPC_URL, FACTORY_CONTRACT_ID, PYUSD_SAC_CONTRACT } from '@/config';

const server = new rpc.Server(SOROBAN_RPC_URL);

export interface SplitterConfig {
  token: string;
  recipients: string[];
  shares: number[];
}

export async function createSplitter(
  kit: StellarWalletsKit,
  userAddress: string,
  recipients: string[],
  shares: number[]
): Promise<string> {
  const account = await server.getAccount(userAddress);
  const factory = new Contract(FACTORY_CONTRACT_ID);

  // Generate a random salt for this splitter instance
  const saltArray = crypto.getRandomValues(new Uint8Array(32));

  let transaction = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      factory.call(
        'create',
        nativeToScVal(saltArray, { type: 'bytes' }),
        nativeToScVal(new Address(PYUSD_SAC_CONTRACT), { type: 'address' }),
        nativeToScVal(recipients.map(r => new Address(r)), { type: 'address' }),
        nativeToScVal(shares, { type: 'u32' })
      )
    )
    .setTimeout(30)
    .build();

  const simResponse = await server.simulateTransaction(transaction);

  if (rpc.Api.isSimulationError(simResponse)) {
    const errorMsg = simResponse.error || 'Unknown error';
    throw new Error(`Simulation failed: ${errorMsg}`);
  }

  if (!rpc.Api.isSimulationSuccess(simResponse)) {
    throw new Error('Simulation did not succeed');
  }

  transaction = rpc.assembleTransaction(transaction, simResponse).build();

  const { signedTxXdr } = await kit.signTransaction(transaction.toXDR(), {
    address: userAddress,
    networkPassphrase: NETWORK_PASSPHRASE,
  });

  const tx = TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE);
  const response = await server.sendTransaction(tx);

  // Wait for confirmation
  let status = await server.getTransaction(response.hash);
  while (status.status === 'NOT_FOUND') {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    status = await server.getTransaction(response.hash);
  }

  if (status.status === 'SUCCESS' && status.returnValue) {
    const splitterAddress = scValToNative(status.returnValue);
    return splitterAddress;
  }

  throw new Error(`Failed to create splitter: ${status.status}`);
}

export async function getSplitterConfig(splitterAddress: string): Promise<SplitterConfig> {
  const contract = new Contract(splitterAddress);

  // For simulations, we need any valid account - using a placeholder source account
  const placeholderSource = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';
  const account = await server.getAccount(placeholderSource).catch(() => {
    // If placeholder doesn't exist, create a minimal account object for simulation
    return new rpc.Server(SOROBAN_RPC_URL).getAccount(placeholderSource).catch(() => ({
      accountId: () => placeholderSource,
      sequenceNumber: () => '0',
      incrementSequenceNumber: () => {},
    } as Account));
  });

  const transaction = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call('get_config'))
    .setTimeout(30)
    .build();

  const response = await server.simulateTransaction(transaction);

  if (rpc.Api.isSimulationSuccess(response) && response.result?.retval) {
    const [token, recipients, shares] = scValToNative(response.result.retval);
    return {
      token,
      recipients,
      shares,
    };
  }

  throw new Error('Failed to get splitter config');
}

export async function getSplitterBalance(splitterAddress: string): Promise<string> {
  const contract = new Contract(PYUSD_SAC_CONTRACT);

  // For simulations, use placeholder account
  const placeholderSource = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';
  const account = await server.getAccount(placeholderSource).catch(() => {
    return new rpc.Server(SOROBAN_RPC_URL).getAccount(placeholderSource).catch(() => ({
      accountId: () => placeholderSource,
      sequenceNumber: () => '0',
      incrementSequenceNumber: () => {},
    } as Account));
  });

  const transaction = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call('balance', nativeToScVal(new Address(splitterAddress), { type: 'address' }))
    )
    .setTimeout(30)
    .build();

  const response = await server.simulateTransaction(transaction);

  if (rpc.Api.isSimulationSuccess(response) && response.result?.retval) {
    const balance = scValToNative(response.result.retval);
    return (Number(balance) / 10_000_000).toFixed(7);
  }

  return '0';
}

export async function distributeSplitter(
  kit: StellarWalletsKit,
  userAddress: string,
  splitterAddress: string
): Promise<string> {
  const account = await server.getAccount(userAddress);
  const contract = new Contract(splitterAddress);

  let transaction = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call('distribute'))
    .setTimeout(30)
    .build();

  const simResponse = await server.simulateTransaction(transaction);

  if (rpc.Api.isSimulationError(simResponse)) {
    throw new Error(`Simulation failed: ${simResponse.error}`);
  }

  if (!rpc.Api.isSimulationSuccess(simResponse)) {
    throw new Error('Simulation did not succeed');
  }

  transaction = rpc.assembleTransaction(transaction, simResponse).build();

  const { signedTxXdr } = await kit.signTransaction(transaction.toXDR(), {
    address: userAddress,
    networkPassphrase: NETWORK_PASSPHRASE,
  });

  const tx = TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE);
  const response = await server.sendTransaction(tx);

  return response.hash;
}
