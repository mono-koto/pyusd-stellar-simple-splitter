#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, vec, Address, Env};

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

    // This should panic because factory wasn't initialized
    factory.create(
        &token,
        &vec![&env, alice.clone(), bob.clone()],
        &vec![&env, 1, 1],
    );
}
