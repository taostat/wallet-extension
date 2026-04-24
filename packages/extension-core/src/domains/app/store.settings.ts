import { TokenRateCurrency } from "@taostats-wallet/token-rates"
import { IS_FIREFOX } from "extension-shared"

import { StorageProvider } from "../../libs/Store"
import { IdenticonType } from "../accounts/types"

export type LedgerTransportType = "usb" | "hid"

export interface SettingsStoreData {
  useErrorTracking: boolean
  identiconType: IdenticonType
  useAnalyticsTracking?: boolean // undefined during onboarding
  hideBalances: boolean
  hideDust: boolean
  leaveDustOnMaxSendTao: boolean
  allowNotifications: boolean
  selectedAccount?: string // undefined = show all accounts
  collapsedFolders?: string[] // persists the collapsed folders in the dashboard account picker
  autoLockMinutes: number
  selectableCurrencies: TokenRateCurrency[]
  selectedCurrency: TokenRateCurrency
  newFeaturesDismissed: string
  autoRiskScan?: boolean // undefined = user has never been prompted to use the feature
  nftsViewMode: "list" | "tiles"
  nftsSortBy: "value" | "name" | "date"
  tokensSortBy: "name" | "total" | "locked" | "available"
  developerMode: boolean
  polkadotVaultSignWithProof: boolean
  ledgerTransportType: LedgerTransportType
  dtaoSlippage?: number
}

export class SettingsStore extends StorageProvider<SettingsStoreData> {}

export const DEFAULT_SETTINGS: SettingsStoreData = {
  useErrorTracking: !IS_FIREFOX,
  identiconType: "polkadot-identicon",
  useAnalyticsTracking: undefined, // undefined for onboarding
  hideBalances: false,
  hideDust: false,
  leaveDustOnMaxSendTao: true,
  allowNotifications: true,
  autoLockMinutes: 15,
  selectableCurrencies: ["usd", "tao"],
  selectedCurrency: "tao",
  newFeaturesDismissed: "0",
  nftsViewMode: "tiles",
  tokensSortBy: "total",
  nftsSortBy: "date",
  developerMode: false,
  polkadotVaultSignWithProof: true,
  ledgerTransportType: "hid",
}

export const settingsStore = new SettingsStore("settings", DEFAULT_SETTINGS)
