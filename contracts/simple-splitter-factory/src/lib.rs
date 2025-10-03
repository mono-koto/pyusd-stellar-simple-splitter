#![no_std]

use soroban_sdk::{
    contract, contractimpl, contractclient, symbol_short, xdr::ToXdr, Address, BytesN, Env,
    Symbol, Vec,
};

mod test;

const WASM_HASH: Symbol = symbol_short!("wasm");

// Define the SimpleSplitter client interface
#[contractclient(name = "SimpleSplitterClient")]
pub trait SimpleSplitterTrait {
    fn init(env: Env, token: Address, recipients: Vec<Address>, shares: Vec<u32>);
}

#[contract]
pub struct SimpleSplitterFactory;

/// Factory contract for deploying SimpleSplitter instances.
#[contractimpl]
impl SimpleSplitterFactory {
    /// Initialize the factory with the SimpleSplitter WASM hash.
    /// This should be called once after deploying the factory.
    pub fn init(env: Env, splitter_wasm_hash: BytesN<32>) {
        env.storage()
            .instance()
            .set(&WASM_HASH, &splitter_wasm_hash);
        env.storage().instance().extend_ttl(5000, 5000);
    }

    /// Create a new SimpleSplitter contract with the given parameters.
    /// Returns the address of the newly deployed contract.
    pub fn create(
        env: Env,
        token: Address,
        recipients: soroban_sdk::Vec<Address>,
        shares: soroban_sdk::Vec<u32>,
    ) -> Address {
        let wasm_hash: BytesN<32> = env
            .storage()
            .instance()
            .get(&WASM_HASH)
            .expect("Factory not initialized with WASM hash");

        // Deploy the contract with a pseudo-random salt based on ledger and nonce
        // This allows multiple splitters with the same configuration
        // Combine ledger sequence with current ledger timestamp for more entropy
        let mut salt_data = soroban_sdk::Bytes::new(&env);
        salt_data.append(&env.ledger().sequence().to_xdr(&env));
        salt_data.append(&env.ledger().timestamp().to_xdr(&env));
        let salt = env.crypto().sha256(&salt_data);

        let contract_id = env
            .deployer()
            .with_current_contract(salt)
            .deploy_v2(wasm_hash, Vec::<soroban_sdk::Val>::new(&env));

        // Initialize the deployed contract using the client
        let splitter = SimpleSplitterClient::new(&env, &contract_id);
        splitter.init(&token, &recipients, &shares);

        // Emit event for better observability
        env.events()
            .publish((symbol_short!("created"),), contract_id.clone());

        contract_id
    }
}
