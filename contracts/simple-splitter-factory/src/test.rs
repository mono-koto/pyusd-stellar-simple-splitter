#![cfg(test)]

use super::*;
use simple_splitter::SimpleSplitterClient;
use soroban_sdk::{
    testutils::{Address as _, Events},
    vec, Address, Env,
};

// Import optimized SimpleSplitter WASM
mod simple_splitter_wasm {
    soroban_sdk::contractimport!(
        file = "../../target/wasm32-unknown-unknown/release/simple_splitter.optimized.wasm"
    );
}

fn setup_test_env() -> Env {
    let env = Env::default();
    env.mock_all_auths();
    env
}

fn create_factory(env: &Env) -> (Address, SimpleSplitterFactoryClient<'_>) {
    let contract_id = env.register(SimpleSplitterFactory, ());
    let client = SimpleSplitterFactoryClient::new(env, &contract_id);
    (contract_id, client)
}

fn create_dummy_wasm_hash(env: &Env) -> BytesN<32> {
    // For testing purposes, create a dummy hash
    let dummy_bytes = soroban_sdk::Bytes::from_slice(env, b"dummy_wasm");
    env.crypto().sha256(&dummy_bytes).into()
}

fn create_salt(env: &Env, seed: &[u8]) -> BytesN<32> {
    let bytes = soroban_sdk::Bytes::from_slice(env, seed);
    env.crypto().sha256(&bytes).into()
}

fn get_splitter_wasm_hash(env: &Env) -> BytesN<32> {
    // Upload the optimized SimpleSplitter WASM and get its hash
    env.deployer()
        .upload_contract_wasm(simple_splitter_wasm::WASM)
}

fn create_token(env: &Env) -> Address {
    let token_admin = Address::generate(env);
    let token = env.register_stellar_asset_contract_v2(token_admin);
    token.address()
}

#[test]
fn test_factory_init() {
    let env = setup_test_env();
    let (_factory_id, factory) = create_factory(&env);
    let wasm_hash = create_dummy_wasm_hash(&env);

    // Initialize factory with WASM hash - should not panic
    factory.init(&wasm_hash);
}

#[test]
#[should_panic(expected = "Factory not initialized with WASM hash")]
fn test_create_without_init() {
    let env = setup_test_env();
    let (_factory_id, factory) = create_factory(&env);
    let token = create_token(&env);

    let alice = Address::generate(&env);
    let bob = Address::generate(&env);

    let salt = create_salt(&env, b"test_salt");

    // This should panic because factory wasn't initialized
    factory.create(
        &salt,
        &token,
        &vec![&env, alice.clone(), bob.clone()],
        &vec![&env, 1, 1],
    );
}

#[test]
fn test_create_splitter_success() {
    let env = setup_test_env();
    let (_factory_id, factory) = create_factory(&env);
    let token = create_token(&env);

    // Get SimpleSplitter WASM hash
    let splitter_wasm_hash = get_splitter_wasm_hash(&env);

    // Initialize factory with the SimpleSplitter WASM hash
    factory.init(&splitter_wasm_hash);

    let alice = Address::generate(&env);
    let bob = Address::generate(&env);
    let salt = create_salt(&env, b"test_salt_1");

    // Create a new splitter
    let splitter_address = factory.create(
        &salt,
        &token,
        &vec![&env, alice.clone(), bob.clone()],
        &vec![&env, 1, 1],
    );

    // Verify the splitter contract was deployed and initialized correctly
    let splitter_client = SimpleSplitterClient::new(&env, &splitter_address);
    let (config_token, config_recipients, config_shares) = splitter_client.get_config();

    assert_eq!(config_token, token);
    assert_eq!(config_recipients.len(), 2);
    assert_eq!(config_recipients.get(0).unwrap(), alice);
    assert_eq!(config_recipients.get(1).unwrap(), bob);
    assert_eq!(config_shares.len(), 2);
    assert_eq!(config_shares.get(0).unwrap(), 1);
    assert_eq!(config_shares.get(1).unwrap(), 1);
}

#[test]
fn test_create_multiple_splitters() {
    let env = setup_test_env();
    let (_factory_id, factory) = create_factory(&env);
    let token = create_token(&env);

    // Get SimpleSplitter WASM hash
    let splitter_wasm_hash = get_splitter_wasm_hash(&env);

    // Initialize factory
    factory.init(&splitter_wasm_hash);

    let alice = Address::generate(&env);
    let bob = Address::generate(&env);
    let charlie = Address::generate(&env);

    // Create first splitter
    let salt1 = create_salt(&env, b"splitter_1");
    let splitter1 = factory.create(
        &salt1,
        &token,
        &vec![&env, alice.clone(), bob.clone()],
        &vec![&env, 1, 1],
    );

    // Create second splitter with same parameters but different salt - should get different address
    let salt2 = create_salt(&env, b"splitter_2");
    let splitter2 = factory.create(
        &salt2,
        &token,
        &vec![&env, alice.clone(), bob.clone()],
        &vec![&env, 1, 1],
    );

    // Create third splitter with different parameters
    let salt3 = create_salt(&env, b"splitter_3");
    let splitter3 = factory.create(
        &salt3,
        &token,
        &vec![&env, alice.clone(), bob.clone(), charlie.clone()],
        &vec![&env, 1, 2, 3],
    );

    // Verify all addresses are unique
    assert_ne!(splitter1, splitter2);
    assert_ne!(splitter1, splitter3);
    assert_ne!(splitter2, splitter3);

    // Verify third splitter has correct config
    let splitter3_client = SimpleSplitterClient::new(&env, &splitter3);
    let (_, config_recipients, config_shares) = splitter3_client.get_config();
    assert_eq!(config_recipients.len(), 3);
    assert_eq!(config_shares.get(0).unwrap(), 1);
    assert_eq!(config_shares.get(1).unwrap(), 2);
    assert_eq!(config_shares.get(2).unwrap(), 3);
}

#[test]
fn test_create_emits_event() {
    let env = setup_test_env();
    let (_factory_id, factory) = create_factory(&env);
    let token = create_token(&env);

    // Get SimpleSplitter WASM hash
    let splitter_wasm_hash = get_splitter_wasm_hash(&env);

    // Initialize factory
    factory.init(&splitter_wasm_hash);

    let alice = Address::generate(&env);
    let bob = Address::generate(&env);
    let salt = create_salt(&env, b"event_test");

    // Create a new splitter
    let _splitter_address = factory.create(
        &salt,
        &token,
        &vec![&env, alice.clone(), bob.clone()],
        &vec![&env, 1, 1],
    );

    // Verify event was emitted - just check that events exist
    let events = env.events().all();
    assert!(events.len() > 0, "Expected events to be emitted");
}

#[test]
fn test_create_single_recipient() {
    let env = setup_test_env();
    let (_factory_id, factory) = create_factory(&env);
    let token = create_token(&env);

    // Get SimpleSplitter WASM hash
    let splitter_wasm_hash = get_splitter_wasm_hash(&env);

    // Initialize factory
    factory.init(&splitter_wasm_hash);

    let alice = Address::generate(&env);
    let salt = create_salt(&env, b"single_recipient");

    // Create a splitter with single recipient
    let splitter_address = factory.create(
        &salt,
        &token,
        &vec![&env, alice.clone()],
        &vec![&env, 100],
    );

    // Verify configuration
    let splitter_client = SimpleSplitterClient::new(&env, &splitter_address);
    let (_, config_recipients, config_shares) = splitter_client.get_config();
    assert_eq!(config_recipients.len(), 1);
    assert_eq!(config_recipients.get(0).unwrap(), alice);
    assert_eq!(config_shares.get(0).unwrap(), 100);
}
