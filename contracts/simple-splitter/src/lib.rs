#![no_std]

use soroban_sdk::{contract, contractimpl, symbol_short, Address, Env, Vec};

mod test;

#[contract]
pub struct SimpleSplitter;

/// Stores recipients and share ratios as immutable config.
#[contractimpl]
impl SimpleSplitter {
    pub fn init(env: Env, token: Address, recipients: Vec<Address>, shares: Vec<u32>) {
        assert!(recipients.len() == shares.len(), "length mismatch");
        // persist token, recipients, shares in env storage
        env.storage().instance().set(&symbol_short!("token"), &token);
        env.storage().instance().set(&symbol_short!("recips"), &recipients);
        env.storage().instance().set(&symbol_short!("shares"), &shares);
        env.storage().instance().extend_ttl(5000, 5000);
    }

    pub fn distribute(env: Env) {
        let token: Address = env.storage().instance().get(&symbol_short!("token")).unwrap();
        let recipients: Vec<Address> = env.storage().instance().get(&symbol_short!("recips")).unwrap();
        let shares: Vec<u32> = env.storage().instance().get(&symbol_short!("shares")).unwrap();

        let sac = soroban_sdk::token::Client::new(&env, &token);

        let balance = sac.balance(&env.current_contract_address());

        let total: u128 = shares.iter().map(|s| s as u128).sum();
        for (i, r) in recipients.iter().enumerate() {
            let share = (balance as u128 * shares.get(i as u32).unwrap() as u128) / total;
            if share > 0 {
                sac.transfer(&env.current_contract_address(), &r, &(share as i128));
            }
        }
    }

    pub fn get_config(env: Env) -> (Address, Vec<Address>, Vec<u32>) {
        (
            env.storage().instance().get(&symbol_short!("token")).unwrap(),
            env.storage().instance().get(&symbol_short!("recips")).unwrap(),
            env.storage().instance().get(&symbol_short!("shares")).unwrap(),
        )
    }
}