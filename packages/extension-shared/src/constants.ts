const PORT_SUFFIX =
  process.env.BUILD !== "production" ? `-${process.env.BUILD}-${process.env.RELEASE}` : ""
export const PORT_EXTENSION = `taostats-extension${PORT_SUFFIX}`
export const PORT_CONTENT = `taostats-content${PORT_SUFFIX}`

/** injectedWeb3 provider name — must differ per build so prod/dev/internal can coexist on a page. */
export const INJECTED_WEB3_NAME = process.env.INJECTED_WEB3_NAME || "taostats"
/** Page → content script postMessage origin (window channel; must be unique per build). */
export const MSG_ORIGIN_PAGE = process.env.MSG_ORIGIN_PAGE || "taostats-page"
/** Content script → page postMessage origin (window channel; must be unique per build). */
export const MSG_ORIGIN_CONTENT = process.env.MSG_ORIGIN_CONTENT || "taostats-content"

export const OPEN_SIDEPANEL_MESSAGE = "taostats.openSidePanel"
export const NAVIGATE_SIDE_PANEL_MESSAGE = "taostats.navigateSidePanel"
export const SIDE_PANEL_MOUNTED_MESSAGE = "taostats.sidePanelMounted"
export const SIDE_PANEL_UNMOUNTED_MESSAGE = "taostats.sidePanelUnmounted"
export const SIDE_PANEL_VISIBILITY_MESSAGE = "taostats.sidePanelVisibility"
export const SIDE_PANEL_AFTER_APPROVAL_MESSAGE = "taostats.sidePanelAfterApproval"
export const CLOSE_SIDE_PANEL_MESSAGE = "taostats.closeSidePanel"
/** Session storage key: whether the side panel was already open when a dapp approval started. */
export const SIDE_PANEL_WAS_OPEN_KEY = "sidePanelWasOpenBeforeApproval"
/** Session storage key: dapp tab that owns the tab-scoped approval side panel. */
export const SIDE_PANEL_APPROVAL_TAB_KEY = "sidePanelApprovalTabId"

/** Dapp RPC messages that require user approval UI. */
export const APPROVAL_UI_MESSAGES = new Set([
  "pub(authorize.tab)",
  "pub(bytes.sign)",
  "pub(extrinsic.sign)",
  "pub(metadata.provide)",
  "pub(encrypt.encrypt)",
  "pub(encrypt.decrypt)",
])
export const DEBUG = process.env.DEBUG === "true"
export const TEST = process.env.NODE_ENV === "test"

export const IS_FIREFOX = process.env.BROWSER === "firefox"
export const IS_CHROME = process.env.BROWSER === "chrome"

export const TAOSTATS_API_URL = process.env.TAOSTATS_API_URL
export const ASSET_DISCOVERY_API_URL = ""

export const TAOSTATS_WEB_APP_DOMAIN = "taostats.io"
export const TAOSTATS_WEB_APP_URL = "https://taostats.io"
export const TAOSTATS_WEB_APP_STAKING_URL = "https://dash.taostats.io/stake"
export const TAOSTATS_WEB_APP_SWAP_URL = "https://taostats.io/swap"

export const SIGNET_LANDING_URL = ""
export const SIGNET_APP_URL = ""

// Wallet-specific invite link
export const DISCORD_URL = "https://discord.taostats.io"

// Docs URLs
export const DOCS_URL_PREFIX = "https://docs.talisman.xyz/talisman"
export const POLKADOT_VAULT_DOCS_URL = `${DOCS_URL_PREFIX}/start/importing-external-wallets/import-from-polkadot-vault`
export const PRIVACY_POLICY_URL = `${TAOSTATS_WEB_APP_URL}/extension/privacy-policy`
export const TERMS_OF_USE_URL = `${TAOSTATS_WEB_APP_URL}/extension/terms-of-use`
export const CONNECT_LEDGER_DOCS_URL = `${DOCS_URL_PREFIX}/start/importing-external-wallets/import-from-ledger`

// Images
export const UNKNOWN_TOKEN_URL = "/images/icon.png"
export const UNKNOWN_NETWORK_URL = "/images/icon.png"
