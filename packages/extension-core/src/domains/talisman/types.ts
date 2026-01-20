import type { JsonRpcResponse } from "@polkadot/rpc-provider/types"
import type { DotNetwork, EthNetwork, Token } from "@taostats-wallet/chaindata-provider"
import { HexString } from "@polkadot/util/types"

// to account for new requirement for generic arg in this type https://github.com/polkadot-js/api/commit/f4c2b150d3d69d43c56699613666b96dd0a763f4#diff-f87c17bc7fae027ec6d43bac5fc089614d9fa097f466aa2be333b44cee81f0fd
// TODO incrementally replace 'unknown' with proper types where possible
export type UnknownJsonRpcResponse<T = unknown> = JsonRpcResponse<T>

export type RequestRpcByGenesisHashSend = {
  genesisHash: HexString
  method: string
  params: unknown[]
}

export type RequestRpcByGenesisHashSubscribe = {
  genesisHash: HexString
  subscribeMethod: string
  responseMethod: string
  params: unknown[]
  timeout: number | false
}

export type RequestRpcByGenesisHashUnsubscribe = {
  subscriptionId: string
  unsubscribeMethod: string
}

export interface TaostatsMessages {
  // chain message signatures
  "pub(taostats.rpc.byGenesisHash.send)": [RequestRpcByGenesisHashSend, UnknownJsonRpcResponse]
  "pub(taostats.rpc.byGenesisHash.subscribe)": [
    RequestRpcByGenesisHashSubscribe,
    string,
    { error: Error | null; data: unknown },
  ]
  "pub(taostats.rpc.byGenesisHash.unsubscribe)": [RequestRpcByGenesisHashUnsubscribe, boolean]
  "pub(taostats.extension.openPortfolio)": [null, boolean]

  // TODO yeet everything below once discussed with the team
  "pub(taostats.customSubstrateChains.subscribe)": [null, string, DotNetwork[]]
  "pub(taostats.customSubstrateChains.unsubscribe)": [string, boolean]
  "pub(taostats.customEvmNetworks.subscribe)": [null, string, EthNetwork[]]
  "pub(taostats.customEvmNetworks.unsubscribe)": [string, boolean]
  "pub(taostats.customTokens.subscribe)": [null, string, Token[]]
  "pub(taostats.customTokens.unsubscribe)": [string, boolean]
}
