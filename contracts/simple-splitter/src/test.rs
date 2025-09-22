#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, token, vec, Address, Env};

fn setup_test_env() -> Env {
    let env = Env::default();
    env.mock_all_auths();
    env
}

fn create_contract(env: &Env) -> (Address, SimpleSplitterClient<'_>) {
    let contract_id = env.register(SimpleSplitter, ());
    let client = SimpleSplitterClient::new(env, &contract_id);
    (contract_id, client)
}

fn create_token(env: &Env) -> Address {
    let token_admin = Address::generate(env);
    let token = env.register_stellar_asset_contract_v2(token_admin);
    token.address()
}

fn mint_tokens(env: &Env, contract_id: &Address, token_address: &Address, amount: i128) {
    let token_admin_client = token::StellarAssetClient::new(env, token_address);
    token_admin_client.mint(contract_id, &amount);
}

#[test]
fn test_split() {
    let env = setup_test_env();
    let (contract_id, client) = create_contract(&env);
    let token = create_token(&env);

    let alice = Address::generate(&env);
    let bob = Address::generate(&env);

    client.init(&token, &vec![&env, alice.clone(), bob.clone()], &vec![&env, 1, 1]);

    mint_tokens(&env, &contract_id, &token, 100);
    client.distribute();

    let sac = token::Client::new(&env, &token);
    assert_eq!(sac.balance(&alice), 50);
    assert_eq!(sac.balance(&bob), 50);
}

#[test]
fn test_unequal_shares() {
    let env = setup_test_env();
    let (contract_id, client) = create_contract(&env);
    let token = create_token(&env);

    let alice = Address::generate(&env);
    let bob = Address::generate(&env);

    // Alice gets 2 shares, Bob gets 1 share (2:1 ratio)
    client.init(&token, &vec![&env, alice.clone(), bob.clone()], &vec![&env, 2, 1]);

    mint_tokens(&env, &contract_id, &token, 99); // Use 99 to test even division
    client.distribute();

    let sac = token::Client::new(&env, &token);
    // Alice should get 66 (2/3 of 99), Bob should get 33 (1/3 of 99)
    assert_eq!(sac.balance(&alice), 66);
    assert_eq!(sac.balance(&bob), 33);
}

#[test]
fn test_multiple_recipients() {
    let env = setup_test_env();
    let (contract_id, client) = create_contract(&env);
    let token = create_token(&env);

    let alice = Address::generate(&env);
    let bob = Address::generate(&env);
    let charlie = Address::generate(&env);

    // Equal shares: 1:1:1 ratio
    client.init(&token, &vec![&env, alice.clone(), bob.clone(), charlie.clone()], &vec![&env, 1, 1, 1]);

    mint_tokens(&env, &contract_id, &token, 120); // Divide evenly by 3
    client.distribute();

    let sac = token::Client::new(&env, &token);
    // Each should get 40 tokens (120 / 3)
    assert_eq!(sac.balance(&alice), 40);
    assert_eq!(sac.balance(&bob), 40);
    assert_eq!(sac.balance(&charlie), 40);
}

#[test]
#[should_panic(expected = "length mismatch")]
fn test_mismatched_lengths() {
    let env = setup_test_env();
    let (_contract_id, client) = create_contract(&env);
    let token = create_token(&env);

    let alice = Address::generate(&env);
    let bob = Address::generate(&env);

    // Recipients: 2, Shares: 3 (mismatch should panic)
    client.init(&token, &vec![&env, alice.clone(), bob.clone()], &vec![&env, 1, 2, 3]);
}

#[test]
fn test_zero_balance_distribution() {
    let env = setup_test_env();
    let (_contract_id, client) = create_contract(&env);
    let token = create_token(&env);

    let alice = Address::generate(&env);
    let bob = Address::generate(&env);

    client.init(&token, &vec![&env, alice.clone(), bob.clone()], &vec![&env, 1, 1]);

    // Don't mint any tokens - balance is 0
    client.distribute();

    let sac = token::Client::new(&env, &token);
    // Both should still have 0 balance
    assert_eq!(sac.balance(&alice), 0);
    assert_eq!(sac.balance(&bob), 0);
}

#[test]
fn test_rounding_remainder() {
    let env = setup_test_env();
    let (contract_id, client) = create_contract(&env);
    let token = create_token(&env);

    let alice = Address::generate(&env);
    let bob = Address::generate(&env);
    let charlie = Address::generate(&env);

    // Equal shares: 1:1:1 ratio, but 100 tokens don't divide evenly by 3
    client.init(&token, &vec![&env, alice.clone(), bob.clone(), charlie.clone()], &vec![&env, 1, 1, 1]);

    mint_tokens(&env, &contract_id, &token, 100); // 100 / 3 = 33.33...
    client.distribute();

    let sac = token::Client::new(&env, &token);
    
    // Each should get 33 tokens (100 / 3 = 33 remainder 1)
    // The remainder of 1 token should be left in the contract
    assert_eq!(sac.balance(&alice), 33);
    assert_eq!(sac.balance(&bob), 33);
    assert_eq!(sac.balance(&charlie), 33);
    
    // Contract should still have 1 token left (the remainder)
    assert_eq!(sac.balance(&contract_id), 1);
}

#[test]
fn test_empty_recipients() {
    let env = setup_test_env();
    let (contract_id, client) = create_contract(&env);
    let token = create_token(&env);

    // Initialize with empty vectors
    client.init(&token, &vec![&env], &vec![&env]);

    // Should work without error - no recipients to distribute to
    client.distribute();
    
    // Contract should still have 0 balance since nothing was minted
    let sac = token::Client::new(&env, &token);
    assert_eq!(sac.balance(&contract_id), 0);
}

#[test]
fn test_zero_shares() {
    let env = setup_test_env();
    let (contract_id, client) = create_contract(&env);
    let token = create_token(&env);

    let alice = Address::generate(&env);
    let bob = Address::generate(&env);
    let charlie = Address::generate(&env);

    // Alice gets 2 shares, Bob gets 0 shares, Charlie gets 1 share
    client.init(&token, &vec![&env, alice.clone(), bob.clone(), charlie.clone()], &vec![&env, 2, 0, 1]);

    mint_tokens(&env, &contract_id, &token, 90);
    client.distribute();

    let sac = token::Client::new(&env, &token);
    // Alice should get 60 (2/3 of 90), Bob should get 0, Charlie should get 30 (1/3 of 90)
    assert_eq!(sac.balance(&alice), 60);
    assert_eq!(sac.balance(&bob), 0);
    assert_eq!(sac.balance(&charlie), 30);
}

#[test]
#[should_panic]
fn test_distribute_before_init() {
    let env = setup_test_env();
    let (_contract_id, client) = create_contract(&env);
    client.distribute();
}