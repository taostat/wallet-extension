import { Address } from "@taostats-wallet/balances"
import { DotNetworkId, TokenId } from "@taostats-wallet/chaindata-provider"

import { SignerPayloadJSON } from "../signing/types"

// unknown for substrate txs from dapps
export type TransactionStatus = "unknown" | "pending" | "success" | "error" | "replaced"

export type WatchTransactionOptions = {
  siteUrl?: string
  notifications?: boolean
  /**
   * Used to store extra information about this tx.
   * For populating the transaction history.
   * In the future we should migrate transferInfo into this.
   */
  txInfo?: WalletTransactionInfo
}

/** @deprecated */
export type WalletTransactionTransferInfo = {
  /** @deprecated */
  tokenId?: TokenId
  /** @deprecated */
  value?: string
  /** @deprecated */
  to?: Address
}

export type WalletTransactionInfo =
  | { type: "transfer"; tokenId: TokenId; value: string; to: Address }
  | { type: "approve-erc20"; tokenId: TokenId; contractAddress: string; amount: string }
  | {
      type: "swap-simpleswap"
      exchangeId: string
      fromTokenId: TokenId
      toTokenId: TokenId
      fromAmount: string
      toAmount: string
      to: Address
    }
  | {
      type: "swap-stealthex"
      exchangeId: string
      fromTokenId: TokenId
      toTokenId: TokenId
      fromAmount: string
      toAmount: string
      to: Address
    }
  | {
      type: "swap-lifi"
      protocolName: string
      fromTokenId: TokenId
      toTokenId: TokenId
      fromAmount: string
      toAmount: string
      to: Address
    }

/** @deprecated */
export type LegacyWalletTransactionBase = WalletTransactionTransferInfo & {
  account: Address
  siteUrl?: string
  timestamp: number
  hash: string
  status: TransactionStatus
  isReplacement?: boolean
  label?: string
  nonce?: number
  blockNumber?: string
  confirmed?: boolean
  txInfo?: WalletTransactionInfo
}

/** @deprecated */
export type LegacyWalletTransactionDot = LegacyWalletTransactionBase & {
  networkType: "substrate"
  genesisHash: `0x${string}`
  unsigned: SignerPayloadJSON
}

// Named Wallet* this to avoid conflicts with types from various Dexie, Polkadot and Ethers libraries
/** @deprecated */
export type LegacyWalletTransaction = LegacyWalletTransactionDot

export type WalletTransactionDot = {
  id: string
  platform: "polkadot"
  networkId: DotNetworkId
  account: Address
  hash: `0x${string}`
  payload: SignerPayloadJSON
  status: TransactionStatus
  confirmed: boolean
  siteUrl?: string
  label?: string
  nonce: number
  timestamp: number
  txInfo?: WalletTransactionInfo
  blockNumber?: string
  extrinsicIndex?: number
}

export type WalletTransaction = WalletTransactionDot
