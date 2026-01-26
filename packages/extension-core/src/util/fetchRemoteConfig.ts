import { log } from "extension-shared"
import toml from "toml"

import { RemoteConfigStoreData } from "../domains/app/types"

// export const REMOTE_CONFIG_URL = "taostats.url/to/remote-config.toml"

export const fetchRemoteConfig = async () => {
  log.debug("Fetching config.toml")
  // const response = await fetch(REMOTE_CONFIG_URL)

  // if (!response.ok)
  //   throw new Error(`Unable to fetch config.toml: ${response.status} ${response.statusText}`)

  // const text = await response.text()

  try {
    // return toml.parse(text) as RemoteConfigStoreData
    return toml.parse(tomlConfig) as RemoteConfigStoreData
  } catch (e) {
    throw new Error("Unable to parse config.toml", { cause: e })
  }
}

const tomlConfig = `# Used to sort networks in Manage Networks screen
recommendedNetworks = [
    "polkadot",
    "polkadot-asset-hub",
    "bittensor",
    "hydradx",
    "bifrost-polkadot",

    # top networks sorted by TVL picked from defillama.com/chains
    "1",
    "146",                # Sonic
    "8453",               # base
    "1868",               # soneium
    "10",                 # OP mainnet
    "80094",              # berachain
    "42161",              # Arbitrum
    "137",                # Polygon
    "56",                 # binance smart chain
    "43114",              # Avalanche
    "1284",               # moonbeam
    "1116",               # Core
    "60808",              # BOB
    "5000",               # Mantle
    "167000",             # Taiko Alethia
    "592",                # astar evm
    "1285",               # moonriver
    "10143",              # Monad testnet
    "998",                # Hyperliquid testnet
    "6342",               # MegaETH testnet

    # substrate
    "kusama",
    "kusama-asset-hub",
    "autonomys",
    "acala",
    "astar",
    "aleph-zero"
]

[featureFlags]
BUY_CRYPTO = true               # shows the buy crypto button in the wallet
LINK_TX_HISTORY = true          # shows the transaction history link in the wallet
LINK_STAKING = true             # shows the staking link in the wallet
I18N = false                    # enables internationalization
USE_ONFINALITY_API_KEY = false  # enables the use of the onFinality API key
SWAPS = true                    # enables the swaps feature
QUEST_LINK = true               # enables quest link in portfolio header
UNIFIED_ADDRESS_BANNER = false  # enables unified address banners on home page and copy address chain picker
RISK_ANALYSIS_V2 = true         # enables tx validation
AUTONOMYS_QUEST_BANNER = false
NFTS = false                    # obsolete, replaced by NFT_V2
NFTS_V2 = true
SEEK_TAO_DISCOUNT = true
SEEK_BENEFITS = true
SEEK_PRESALE = false
BLOCKAID_DAPP_SCAN = false       # blockaid phishing checks
ASSET_HUB_MIGRATION_BANNER = false

# DEPRECATED as of 2.8.0
[rampSupportedTokenIds]
# To support more tokens add "CHAIN_SYMBOL: tokenId".
# Get the "chain" key and token "symbol" from Ramp's API response, and the tokenId from our chaindata.
POLKADOT_DOT = "polkadot-substrate-native"
DOT_DOT = "polkadot-asset-hub-substrate-native"
KUSAMA_KSM = "kusama-substrate-native"
DOT_USDC = "polkadot-asset-hub-substrate-assets-1337-usdc"
DOT_USDT = "polkadot-asset-hub-substrate-assets-1984-usdt"
MATIC_POL = "137-evm-native"
ETH_USDT = "1-evm-erc20-0xdac17f958d2ee523a2206206994597c13d831ec7"
ARBITRUM_USDT = "42161-evm-erc20-0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9"
OPTIMISM_USDT = "10-evm-erc20-0x94b008aa00579c1307b0ef2c499ad98a8ce58e58"
MATIC_USDT = "137-evm-erc20-0xc2132d05d31c914a87c6611c10748aeb04b58e8f"
ETH_USDC = "1-evm-erc20-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
BASE_USDC = "8453-evm-erc20-0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"
ARBITRUM_USDC = "42161-evm-erc20-0xaf88d065e77c8cc2239327c5edb3a432268e5831"
MATIC_USDC = "137-evm-erc20-0x3c499c542cef5e3811e1192ce70d8cc03d5c3359"
OPTIMISM_USDC = "10-evm-erc20-0x0b2c639c533813f4aa9d7837caf62653d097ff85"
ETH_ETH = "1-evm-native"
OPTIMISM_ETH = "10-evm-native"
ARBITRUM_ETH = "42161-evm-native"
BASE_ETH = "8453-evm-native"
MATIC_ETH = "137-evm-erc20-0x7ceb23fd6bc0add59e62ac25578270cff1b9f619"

# FOR QA BUILDS ONLY - TO DELETE AFTER 2.8.0 RELEASE
[rampNetworks]
# maps Ramp network ids to chain & evmNetwork ids
POLKADOT = "polkadot"
DOT = "polkadot-asset-hub"
KUSAMA = "kusama"
ETH = "1"
BSC = "56"
CELO = "42220"
AVAX = "43114"
MATIC = "137"
XDAI = "100"
ARBITRUM = "42161"
OPTIMISM = "10"
NEAR = "397"
ZKSYNCERA = "324"
POLYGONZKEVM = "1101"
BASE = "8453"
LINEA = "59144"
TELOS = "40"
WORLDCHAIN = "480"
MOONBEAM = "1284"

[coingecko]
apiUrl = ""

[swaps]
questApi = ""
simpleswapApiKey = "9d6ee1b3-1fc1-4fd5-8baf-751c29b9fda8"
simpleswapApiKeyDiscounted = "7697b46d-1de3-4d11-ac71-17137bceb081"
simpleswapDiscountedCurrencies = ["usd1"]
# these tokens are shown in the 🔥 Popular section
curatedTokens = [
  # deprecated ids
  "btc-native", # BTC on Bitcoin (destination only)
  "polkadot-substrate-native", # DOT on Polkadot
  "bittensor-substrate-native", # TAO on Bittensor
  "kusama-substrate-native", # KSM on Kusama
  "1-evm-native", # ETH on Eth
  "1-evm-erc20-0x2260fac5e5542a773aa44fbcfedf7c193bc2c599", # WBTC on Eth
  "1-evm-erc20-0xdac17f958d2ee523a2206206994597c13d831ec7", # USDT on Eth
  "1-evm-erc20-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", # USDC on Eth
  "1-evm-erc20-0x77e06c9eccf2e797fd462a92b6d7642ef85b0a44", # WTAO on Eth
  "1-evm-erc20-0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", # WETH on Eth
  "8453-evm-native", # ETH on Base
  "8453-evm-erc20-0x833589fcd6edb6e08f4c7c32d4f71b54bda02913", # USDC on Base
  "10-evm-native", # ETH on OP
  "42161-evm-native", # ETH on Arb
  "42161-evm-erc20-0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f", # WBTC on Arb
  "42161-evm-erc20-0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9", # USDT on Arb
  "42161-evm-erc20-0xaf88d065e77c8cc2239327c5edb3a432268e5831", # USDC on Arb
  "143-evm-native", # MON on Monad
  "1284-evm-native", # GLMR on Moonbeam
  "moonbeam-substrate-native", # GLMR on Moonbeam
  "polkadot-asset-hub-substrate-assets-1984-usdt", # USDT on AssetHub
  "polkadot-asset-hub-substrate-assets-1337-usdc", # USDC on AssetHub

  "1-evm-erc20-0x07C3E739C65f81Ea79d19A88d27de4C9f15f8Df0", # SEEK on Eth
  # "137-evm-erc20-0x2a69b0383759572081c09f0a68d3a8a955751dde", # DEEK on Polygon

  ## With new token ids! v2.12+
  "btc-native", # BTC on Bitcoin (destination only)
  "polkadot:substrate-native", # DOT on Polkadot
  "bittensor:substrate-native", # TAO on Bittensor
  "kusama:substrate-native", # KSM on Kusama
  "1:evm-native", # ETH on Eth
  "1:evm-erc20:0x2260fac5e5542a773aa44fbcfedf7c193bc2c599", # WBTC on Eth
  "1:evm-erc20:0xdac17f958d2ee523a2206206994597c13d831ec7", # USDT on Eth
  "1:evm-erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", # USDC on Eth
  "1:evm-erc20:0x77e06c9eccf2e797fd462a92b6d7642ef85b0a44", # WTAO on Eth
  "1:evm-erc20:0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", # WETH on Eth
  "8453:evm-native", # ETH on Base
  "8453:evm-erc20-0x833589fcd6edb6e08f4c7c32d4f71b54bda02913", # USDC on Base
  "10:evm-native", # ETH on OP
  "42161:evm-native", # ETH on Arb
  "42161:evm-erc20:0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f", # WBTC on Arb
  "42161:evm-erc20:0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9", # USDT on Arb
  "42161:evm-erc20:0xaf88d065e77c8cc2239327c5edb3a432268e5831", # USDC on Arb
  "143:evm-native", # MON on Monad
  "1284:evm-native", # GLMR on Moonbeam
  "moonbeam:substrate-native", # GLMR on Moonbeam
  "polkadot-asset-hub:substrate-assets:1984", # USDT on AssetHub
  "polkadot-asset-hub:substrate-assets:1337", # USDC on AssetHub

  "1:evm-erc20:0x07C3E739C65f81Ea79d19A88d27de4C9f15f8Df0", # SEEK on Eth
  # "137:evm-erc20:0x2a69b0383759572081c09f0a68d3a8a955751dde", # DEEK on Polygon
]
# these tokens are always shown at the top of the All tokens and 🔥 Popular sections
promotedBuyTokens = [
  "1:evm-erc20:0x07C3E739C65f81Ea79d19A88d27de4C9f15f8Df0", # SEEK on Eth
  # "137:evm-erc20:0x2a69b0383759572081c09f0a68d3a8a955751dde", # DEEK on Polygon
]
promotedSellTokens = [
  "1:evm-erc20:0x07C3E739C65f81Ea79d19A88d27de4C9f15f8Df0", # SEEK on Eth
  # "137:evm-erc20:0x2a69b0383759572081c09f0a68d3a8a955751dde", # DEEK on Polygon
]

[nominationPools]
polkadot-asset-hub = [282, 12, 16]
kusama-asset-hub = [15]
avail = [66, 68, 2]
vara = [8]
aleph-zero = [47]
analog-timechain = [1]

[stakingPools]
bittensor = ["5FtBncJvGhxjBs4aFn2pid6aur9tBUuo9QR7sHe5DkoRizzo"]

[documentation]
unifiedAddressDocsUrl = "https://wiki.polkadot.network/docs/learn-accounts#unified-address-format"

coinbaseProjectId = "63080e24-dc8e-45d0-9618-467b8c222f9e"
pinnedTokens = [
  # deprecated ids
  "polkadot-substrate-native",
  "1-evm-native",
  "bittensor-substrate-native",

  # new ids v2.12+
  "polkadot:substrate-native",
  "1:evm-native",
  "bittensor:substrate-native"
]

[ramps.rampNetworks]
POLKADOT = "polkadot"
DOT = "polkadot-asset-hub"
KUSAMA = "kusama"
ETH = "1"
BSC = "56"
CELO = "42220"
AVAX = "43114"
MATIC = "137"
XDAI = "100"
ARBITRUM = "42161"
OPTIMISM = "10"
NEAR = "397"
ZKSYNCERA = "324"
POLYGONZKEVM = "1101"
BASE = "8453"
LINEA = "59144"
TELOS = "40"
WORLDCHAIN = "480"
MOONBEAM = "1284"

[earn]

[earn.yieldxyzNetworks]
arbitrum="42161"
base="8453"
binance="56"
celo="42220"
core="1116"
ethereum="1"
gnosis="100"
katana="747474"
linea="59144"
moonriver="1285"
optimism="10"
polygon="137"
sonic="146"
unichain="130"
viction="88"
zksync="324"
hyperevm="999"
monad="143"
# polygon-amoy="80002"
# unsupported ones
# avalanche-c="43114"
# polkadot="polkadot" 
# kusama="kusama"
# westend="westend-testnet"
# base-sepolia="84532"
# bittensor="bittensor"
# ethereum-sepolia="11155111"
# solana="solana-mainnet"
# solana-devnet="solana-devnet"

[bittensor]
[bittensor.fee]
[bittensor.fee.buy]
# '45' = 0

[bittensor.fee.sell]
`
