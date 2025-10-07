#![no_std]

use soroban_sdk::{contract, contractimpl, symbol_short, Address, Env, Vec};

mod test;

const ONE_YEAR_LEDGERS: u32 = 5_184_000;

#[contract]
pub struct SimpleSplitter;

/// Stores recipients and share ratios as immutable config.
#[contractimpl]
impl SimpleSplitter {
    pub fn init(env: Env, token: Address, recipients: Vec<Address>, shares: Vec<u32>) {
        // Prevent reinitialization
        if env.storage().instance().has(&symbol_short!("initd")) {
            panic!("already initialized");
        }

        assert!(recipients.len() == shares.len(), "length mismatch");

        // Validate that at least one share is non-zero to prevent division by zero
        let total: u128 = shares.iter().map(|s| s as u128).sum();
        assert!(total > 0, "total shares must be greater than zero");

        // Mark as initialized
        env.storage().instance().set(&symbol_short!("initd"), &true);

        // persist token, recipients, shares in env storage
        env.storage()
            .instance()
            .set(&symbol_short!("token"), &token);
        env.storage()
            .instance()
            .set(&symbol_short!("recips"), &recipients);
        env.storage()
            .instance()
            .set(&symbol_short!("shares"), &shares);
        env.storage()
            .instance()
            .extend_ttl(ONE_YEAR_LEDGERS, ONE_YEAR_LEDGERS);
    }

    pub fn distribute(env: Env) {
        // Reentrancy guard: check if already executing
        if env
            .storage()
            .instance()
            .get::<_, bool>(&symbol_short!("lock"))
            .unwrap_or(false)
        {
            panic!("reentrancy detected");
        }

        // Set reentrancy lock
        env.storage().instance().set(&symbol_short!("lock"), &true);

        let token: Address = env
            .storage()
            .instance()
            .get(&symbol_short!("token"))
            .unwrap();
        let recipients: Vec<Address> = env
            .storage()
            .instance()
            .get(&symbol_short!("recips"))
            .unwrap();
        let shares: Vec<u32> = env
            .storage()
            .instance()
            .get(&symbol_short!("shares"))
            .unwrap();

        let sac = soroban_sdk::token::Client::new(&env, &token);

        let balance = sac.balance(&env.current_contract_address());

        // Ensure balance is non-negative (should always be true for tokens, but be safe)
        if balance < 0 {
            panic!("negative balance");
        }

        let balance_u128 = balance as u128;
        let total: u128 = shares.iter().map(|s| s as u128).sum();

        for (i, r) in recipients.iter().enumerate() {
            let share_ratio = shares.get(i as u32).unwrap() as u128;

            // Use checked arithmetic to prevent overflow
            let share = balance_u128
                .checked_mul(share_ratio)
                .expect("overflow in share calculation")
                .checked_div(total)
                .expect("division error"); // total > 0 guaranteed by init validation

            if share > 0 {
                // Ensure share fits in i128
                let share_i128 = i128::try_from(share).expect("share too large for i128");
                sac.transfer(&env.current_contract_address(), &r, &share_i128);
            }
        }

        // Release reentrancy lock
        env.storage().instance().set(&symbol_short!("lock"), &false);

        // Extend TTL to keep contract alive
        env.storage()
            .instance()
            .extend_ttl(ONE_YEAR_LEDGERS, ONE_YEAR_LEDGERS);
    }

    pub fn get_config(env: Env) -> (Address, Vec<Address>, Vec<u32>) {
        // Extend TTL when reading config
        env.storage()
            .instance()
            .extend_ttl(ONE_YEAR_LEDGERS, ONE_YEAR_LEDGERS);

        (
            env.storage()
                .instance()
                .get(&symbol_short!("token"))
                .unwrap(),
            env.storage()
                .instance()
                .get(&symbol_short!("recips"))
                .unwrap(),
            env.storage()
                .instance()
                .get(&symbol_short!("shares"))
                .unwrap(),
        )
    }
}
