# PYUSD Simple Splitter - Basic Deployment

# Build contracts
build:
    cargo build --release --target wasm32-unknown-unknown
    stellar contract optimize --wasm target/wasm32-unknown-unknown/release/simple_splitter.wasm
    stellar contract optimize --wasm target/wasm32-unknown-unknown/release/simple_splitter_factory.wasm

# Test contracts
test:
    cargo test --all

# Deploy splitter contract (uses .env for network and private key)
deploy-splitter:
    #!/bin/bash
    set -a && source .env && set +a
    echo "Deploying SimpleSplitter to $STELLAR_NETWORK..."
    stellar contract deploy --network $STELLAR_NETWORK --source $PRIVATE_KEY --wasm target/wasm32-unknown-unknown/release/simple_splitter.optimized.wasm

# Deploy factory contract (uses .env for network and private key)
deploy-factory splitter_wasm_hash:
    #!/bin/bash
    set -a && source .env && set +a
    echo "Deploying Factory to $STELLAR_NETWORK..."
    FACTORY_ID=$(stellar contract deploy --network $STELLAR_NETWORK --source $PRIVATE_KEY --wasm target/wasm32-unknown-unknown/release/simple_splitter_factory.optimized.wasm)
    echo "Factory deployed: $FACTORY_ID"
    stellar contract invoke --network $STELLAR_NETWORK --source $PRIVATE_KEY --id $FACTORY_ID -- init --splitter_wasm_hash {{splitter_wasm_hash}}
    echo "Factory initialized with WASM hash: {{splitter_wasm_hash}}"

# Create splitter using factory (uses .env for configuration)
create-splitter factory_id recipients shares:
    #!/bin/bash
    set -a && source .env && set +a
    echo "Creating splitter via factory..."
    stellar contract invoke \
        --network $STELLAR_NETWORK \
        --source $PRIVATE_KEY \
        --id {{factory_id}} \
        -- create \
        --token $PYUSD_SAC_CONTRACT \
        --recipients {{recipients}} \
        --shares {{shares}}