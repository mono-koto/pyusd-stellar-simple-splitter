# PYUSD Simple Splitter on Stellar

A demonstration of [PYUSD](https://paxos.com/pyusd/) token splitting on [Stellar](https://stellar.org) using [Soroban](https://soroban.stellar.org) smart contracts. This project shows how to automatically distribute PYUSD tokens among multiple recipients based on predefined share ratios.

## Overview

This project includes two smart contracts:

1. SimpleSplitter - Core contract that splits PYUSD tokens proportionally among recipients
2. SimpleSplitterFactory - Factory contract for deploying new splitter instances

### Notes

- Recipients and shares are set at initialization and cannot be changed
- Uses proportional math to minimize computation costs
- Factory pattern enables deployment of multiple splitter instances
- Factory emits events for off-chain tracking

## Features

- Proportional distribution based on customizable share ratios
- Factory pattern for easy splitter deployment
- Works with PYUSD on Stellar testnet and mainnet
- Event emission for tracking deployed splitters
- Integer math with remainder staying in contract

## PYUSD on Stellar

| Network | PYUSD Asset                                                      | SAC Contract                                               |
| ------- | ---------------------------------------------------------------- | ---------------------------------------------------------- |
| Testnet | `PYUSD:GBT2KJDKUZYZTQPCSR57VZT5NJHI4H7FOB5LT5FPRWSR7I5B4FS3UU7G` | `CACZL3MGXXP3O6ROMB4Q36ROFULRWD6QARPE3AKWPSWMYZVF2474CBXP` |
| Mainnet | `PYUSD:GDQE7IXJ4HUHV6RQHIUPRJSEZE4DRS5WY577O2FY6YQ5LVWZ7JZTU2V5` | `CAKBVGHJIK2HPP5JPT2UOP27O2IMKIUUCFGP3LOOMGCZLE3NP73Z44H6` |

## Deployed Contracts

### Testnet Factory
- Contract ID: `CA6BN2HYVKCNQAFBFOJ3AFBDR3NTD53MC34YRV4EHODS4ZHYCJQYR4A2`
- [View on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CA6BN2HYVKCNQAFBFOJ3AFBDR3NTD53MC34YRV4EHODS4ZHYCJQYR4A2)

## Web Interface

A user-friendly web interface is available for creating and managing splitters:

🌐 **[Live Demo](https://mono-koto.github.io/pyusd-stellar-simple-splitter/)** (Testnet only)

Features:
- Connect wallet using Stellar Wallets Kit (Freighter, xBull, Albedo, etc.)
- Create new splitters with custom recipients and share ratios
- View splitter details including balance and recipient allocations
- Distribute PYUSD to recipients with one click
- Links to Stellar Expert for detailed contract and account information

## Project Structure

```
.
├── contracts/
│   ├── simple-splitter/          # Core splitter contract
│   │   ├── src/lib.rs            # Main contract logic
│   │   └── src/test.rs           # Contract tests
│   └── simple-splitter-factory/  # Factory contract
│       ├── src/lib.rs            # Factory logic
│       └── src/test.rs           # Factory tests
├── frontend/                     # Web interface
│   ├── src/
│   │   ├── components/           # React components
│   │   ├── contexts/             # Wallet context
│   │   ├── lib/                  # Contract utilities
│   │   └── config.ts             # Network configuration
│   └── package.json
├── justfile                      # Deployment commands
└── README.md
```

## Prerequisites

- **Rust** with `wasm32-unknown-unknown` target
- **Stellar CLI** - [Installation guide](https://developers.stellar.org/docs/tools/cli/install-cli)
- **Just** command runner - `cargo install just`
- A Stellar wallet with XLM for transaction fees and testnet PYUSD

> **Note:** See [pyusd-stellar-recipes](https://github.com/mono-koto/pyusd-stellar-recipes) for instructions on setting up a local wallet, getting testnet XLM, and obtaining testnet PYUSD.

## Quick Start

### 1. Configure Environment

Copy the example environment file and fill in your details:

```bash
cp .env.example .env
# Edit .env with your Stellar secret key and network preference
```

### 2. Build Contracts

```bash
just build
```

### 3. Run Tests

```bash
just test
```

### 4. Deploy to Testnet

First, upload the SimpleSplitter WASM and get its hash:

```bash
just upload-splitter
```

This returns a WASM hash. Use it to deploy and initialize the factory:

```bash
just deploy-factory <wasm_hash>
```

### 5. Create a Splitter

Use the factory to create a new splitter (50/50 split example):

```bash
just create-splitter <factory_contract_id> '["GADDRESS1...", "GADDRESS2..."]' '[1, 1]'
```

## Contract APIs

### SimpleSplitter

```rust
// Initialize splitter with token, recipients, and shares
pub fn init(env: Env, token: Address, recipients: Vec<Address>, shares: Vec<u32>)

// Distribute current contract balance proportionally
pub fn distribute(env: Env)

// Get current configuration
pub fn get_config(env: Env) -> (Address, Vec<Address>, Vec<u32>)
```

### SimpleSplitterFactory

```rust
// Initialize factory with SimpleSplitter WASM hash
pub fn init(env: Env, splitter_wasm_hash: BytesN<32>)

// Create new splitter instance
pub fn create(env: Env, token: Address, recipients: Vec<Address>, shares: Vec<u32>) -> Address
```


## Getting Testnet PYUSD

To get testnet PYUSD for testing:

1. **Get testnet XLM**: Use `stellar request-tokens` or [Stellar Laboratory](https://laboratory.stellar.org/#account-creator)
2. **Create PYUSD trustline**: Add trustline to the PYUSD testnet issuer
3. **Get testnet PYUSD**: Visit [Paxos PYUSD Testnet Faucet](https://faucet.paxos.com/)

## Related Projects

- **[pyusd-stellar-recipes](https://github.com/mono-koto/pyusd-stellar-recipes)** - TypeScript examples for PYUSD on Stellar
- **[pyusd-arbitrum-splitter](https://github.com/mono-koto/pyusd-arbitrum-splitter)** - Similar splitter implementation on Arbitrum

## Development

### Smart Contracts

```bash
cargo fmt
cargo clippy
cargo test
cargo build --release
```

### Frontend

```bash
cd frontend
npm install
npm run dev      # Start development server
npm run build    # Build for production
```

The frontend is built with:
- **Vite + React + TypeScript** - Modern build tooling and type safety
- **Tailwind CSS + ShadCN** - Styling and UI components
- **@creit.tech/stellar-wallets-kit** - Multi-wallet support (Freighter, xBull, Albedo, etc.)
- **@stellar/stellar-sdk** - Stellar/Soroban contract interactions
- **TanStack Query** - Async state management
- **Wouter** - Lightweight routing
- **Sonner** - Toast notifications


## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

This project demonstrates PYUSD integration patterns on Stellar. Contributions welcome!
