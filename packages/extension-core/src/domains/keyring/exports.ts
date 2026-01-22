// export only types and type guards, they are needed by the front end
export type * from "@taostats-wallet/keyring"

export {
  isAccountOfType,
  isAccountAddressEthereum,
  isAccountExternal,
  isAccountInTypes,
  isAccountOwned,
  isAccountAddressSs58,
  isAccountPlatformPolkadot,
  isAccountPortfolio,
  isAccountLedgerPolkadotGeneric,
  isAccountLedgerPolkadotLegacy,
  isAccountBitcoin,
  isAccountNotContact,
  getAccountGenesisHash,
  getAccountSignetUrl,
} from "@taostats-wallet/keyring"
