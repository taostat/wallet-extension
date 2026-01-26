# @taostats-wallet/balances

<img src="taostats.svg" alt="Taostats" width="15%" align="right" />

**@taostats-wallet/balances** is the core of a set of packages used to subscribe to on-chain account token balances.

A quick rundown on each package is given below.

### This (the core) package:

**@taostats-wallet/balances** (this package) includes:

- An API which wallets / dapps can use to access balances
- An interface for balance modules to implement
- A shared database (powered by dexie) for balance modules to store balances in
- Helpers (utility functions) for balance modules to use
- Provides a plugin architecture, which is used by the balance module packages to specify their balance types

### The react API for wallets & dapps:

**@taostats-wallet/balances-react** includes:

- React hooks for subscribing to on-chain account token balances
- (soon™): recoil atoms for on-chain account token balances

### The balance modules:

**@taostats-wallet/balances-default-modules**

- Collates the default balance modules (which can be found below) into a single package

**@taostats-wallet/substrate-native**

- A balance module for substrate native tokens
- Subscribes to the `system.account` state query balance for each token
- Also subscribes to the crowdloans pallet balances
- Also subscribes to the nompools pallet balances

**@taostats-wallet/substrate-orml**

- A proof-of-concept balance module for ORML token pallet tokens
- Attempts to auto-detect tokens
- **You should use @taostats-wallet/substrate-tokens instead**

**@taostats-wallet/substrate-tokens**

- A balance module for substrate ORML token pallet tokens
- Supports any token which can be queried via the `tokens.accounts` state query
- Requires configuration for each token (no auto-detection)
- We recommend that you use this module for ORML tokens

**@taostats-wallet/substrate-assets**

- A balance module for substrate assets pallet tokens
- Supports any token which can be queried via the `assets.account` state query
- Requires configuration for each token (no auto-detection)

**@taostats-wallet/substrate-equilibrium**

- A balance module for substrate eqBalances pallet tokens
- Used by [Equilibrium](https://equilibrium.io/) and [Genshiro](https://genshiro.io/)
- Supports auto-detection

**@taostats-wallet/evm-native**

- A balance module for evm native tokens

**@taostats-wallet/evm-erc20**

- A balance module for evm erc20 tokens

### The chain connectors:

**@taostats-wallet/chain-connector**

- A package which manages the open RPC connections to substrate chains
- Allows developers to say "Send this query to the chain with this id", without them needing to specify which RPCs to use
- Ensures that connections are only opened to the chains which are in use by the wallet/dapp
- Ensures that only one connection is open per chain
- Handles exponential backoff in the case of network failures
- Provides an interface which can be shared between a serviceworker and frontend, which enables the two to share the pool of open connections
- Provides an interface which mimics a polkadot-js `WsProvider`, which can be plugged into polkadot-js to make it use the shared pool of open connections

**@taostats-wallet/chain-connector-evm**

- A package which manages the connections to evm chains
- Allows developers to say "Send this query to the chain with this id", without them needing to specify which RPC to use

### The chaindata provider:

**@taostats-wallet/chaindata-provider**

- A database (powered by dexie) to store chains, evm chains and tokens in
- An interface to interact with the database
- Supports custom (end-user-defined) chains and rpc overrides
- Provides a plugin architecture, which is used by the balance module packages to specify their token types

### The remaining packages:

**@taostats-wallet/connection-meta**

- Contains a small db which is used to optimise network performance in the wallet.
- Two metrics are kept:
  - chainPriorityRpc (the last known well-behaved RPC for a chain)
  - chainBackoffInterval (the amount of time the wallet should wait before attempting to connect to a unreachable chain again)

**@taostats-wallet/mutate-metadata**

- A package which can splice a chain's metadata into smaller pieces
- Enables us to make state queries across many chains at once without using all of the browser's memory

**@taostats-wallet/token-rates**

- Fetches and stores coingecko rates for each token in the @taostats-wallet/chaindata-provider database

**@taostats-wallet/util**

- Utility functions shared by the other packages, as well as the wallet and the portal
