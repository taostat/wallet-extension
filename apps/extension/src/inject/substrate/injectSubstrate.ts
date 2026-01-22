import type { ProviderInterfaceCallback } from "@polkadot/rpc-provider/types"
import type { HexString } from "@polkadot/util/types"
import type { DotNetwork, EthNetwork, Token } from "@taostats-wallet/chaindata-provider"
import type { ResponseType, SendRequest } from "extension-core"

type TaostatsWindow = typeof globalThis & {
  taostatsSub?: ReturnType<typeof rpcProvider> &
    ReturnType<typeof tokensProvider> &
    ReturnType<typeof extensionUiProvider>
}

const rpcProvider = (sendRequest: SendRequest) => ({
  rpcByGenesisHashSend: (
    genesisHash: HexString,
    method: string,
    params: unknown[],
  ): Promise<ResponseType<"pub(taostats.rpc.byGenesisHash.send)">> =>
    sendRequest("pub(taostats.rpc.byGenesisHash.send)", { genesisHash, method, params }),

  rpcByGenesisHashSubscribe: (
    genesisHash: HexString,
    subscribeMethod: string,
    responseMethod: string,
    params: unknown[],
    callback: ProviderInterfaceCallback,
    timeout: number | false,
  ): Promise<ResponseType<"pub(taostats.rpc.byGenesisHash.subscribe)">> =>
    sendRequest(
      "pub(taostats.rpc.byGenesisHash.subscribe)",
      { genesisHash, subscribeMethod, responseMethod, params, timeout },
      ({ error, data }) => callback(error, data),
    ),

  rpcByGenesisHashUnsubscribe: (
    subscriptionId: string,
    unsubscribeMethod: string,
  ): Promise<ResponseType<"pub(taostats.rpc.byGenesisHash.unsubscribe)">> =>
    sendRequest("pub(taostats.rpc.byGenesisHash.unsubscribe)", {
      subscriptionId,
      unsubscribeMethod,
    }),
})

const tokensProvider = (sendRequest: SendRequest) => ({
  subscribeCustomSubstrateChains: (callback: (chains: DotNetwork[]) => unknown) => {
    const idPromise = sendRequest("pub(taostats.customSubstrateChains.subscribe)", null, callback)
    return () =>
      idPromise.then((id) => sendRequest("pub(taostats.customSubstrateChains.unsubscribe)", id))
  },
  subscribeCustomTokens: (callback: (tokens: Token[]) => unknown) => {
    const idPromise = sendRequest("pub(taostats.customTokens.subscribe)", null, callback)
    return () => idPromise.then((id) => sendRequest("pub(taostats.customTokens.unsubscribe)", id))
  },
})

const extensionUiProvider = (sendRequest: SendRequest) => ({
  openFullscreenPortfolio: () => sendRequest("pub(taostats.extension.openPortfolio)", null),
})

export const injectSubstrate = (sendRequest: SendRequest) => {
  // small helper with the typescript types, just cast window
  const windowInject = window as TaostatsWindow

  windowInject.taostatsSub = {
    ...rpcProvider(sendRequest),
    ...tokensProvider(sendRequest),
    ...extensionUiProvider(sendRequest),
  }
}
