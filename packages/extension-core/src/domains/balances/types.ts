import { BalancesResult, IBalance } from "@taostats-wallet/balances"
import { TokenId } from "@taostats-wallet/chaindata-provider"
import { TokenRateCurrency } from "@taostats-wallet/token-rates"

import { Address } from "../../types/base"

export interface RequestBalance {
  tokenId: TokenId
  address: Address
}

export type BalanceSubscriptionResponse = BalancesResult

export type AddressesAndTokens = {
  addresses: Address[]
  tokenIds: TokenId[]
}
export interface RequestBalancesByParamsSubscribe {
  addressesAndTokens: AddressesAndTokens
}

export type BalanceTotal = {
  address: Address
  total: number
  currency: TokenRateCurrency
}

export interface BalancesMessages {
  // balance message signatures
  "pri(balances.get)": [RequestBalance, IBalance | null]
  "pri(balances.subscribe)": [null, boolean, BalanceSubscriptionResponse]
  "pri(balances.byparams.subscribe)": [
    RequestBalancesByParamsSubscribe,
    boolean,
    BalanceSubscriptionResponse,
  ]
}
