const PORT_SUFFIX =
  process.env.BUILD !== "production" ? `-${process.env.BUILD}-${process.env.RELEASE}` : ""
export const PORT_EXTENSION = `taostats-extension${PORT_SUFFIX}`
export const PORT_CONTENT = `taostats-content${PORT_SUFFIX}`
export const DEBUG = process.env.DEBUG === "true"
export const TEST = process.env.NODE_ENV === "test"

export const IS_FIREFOX = process.env.BROWSER === "firefox"

export const IPFS_GATEWAY = "https://talisman.mypinata.cloud/ipfs/"

export const TAOSTATS_BASE_PATH = process.env.TAOSTATS_BASE_PATH
export const ASSET_DISCOVERY_API_URL = ""

export const TAOSTATS_WEB_APP_DOMAIN = "taostats.io"
export const TAOSTATS_WEB_APP_URL = "https://taostats.io"
export const TAOSTATS_WEB_APP_STAKING_URL = "https://dash.taostats.io/stake"
export const TAOSTATS_WEB_APP_SWAP_URL = "https://taostats.io/swap"

export const SIGNET_LANDING_URL = ""
export const SIGNET_APP_URL = ""

// Wallet-specific invite link
export const DISCORD_URL = "https://discord.gg/g4WNuFjW"

// Docs URLs
export const DOCS_URL_PREFIX = "https://docs.talisman.xyz/talisman"
export const POLKADOT_VAULT_DOCS_URL = `${DOCS_URL_PREFIX}/start/importing-external-wallets/import-from-polkadot-vault`
export const PRIVACY_POLICY_URL = `${TAOSTATS_WEB_APP_URL}/extension/privacy-policy`
export const TERMS_OF_USE_URL = `${TAOSTATS_WEB_APP_URL}/extension/terms-of-use`
export const CONNECT_LEDGER_DOCS_URL = `${DOCS_URL_PREFIX}/start/importing-external-wallets/import-from-ledger`

// Images
export const UNKNOWN_TOKEN_URL = "/images/unknown-token.svg"
export const UNKNOWN_NETWORK_URL = "/images/unknown-network.svg"
