import { isNetworkCustom, isTokenCustom } from "@taostats-wallet/chaindata-provider"
import { isInternalUrl } from "extension-shared"
import { map } from "rxjs"

import type { MessageTypes, RequestTypes, ResponseType } from "../../../types"
import type { Port } from "../../../types/base"
import { TabStore } from "../../../handlers/stores"
import { genericSubscription, unsubscribe } from "../../../handlers/subscriptions"
import { TabsHandler } from "../../../libs/Handler"
import { windowManager } from "../../../libs/WindowManager"
import { chaindataProvider } from "../../../rpcs/chaindata"
import RpcHandler from "./rpc"

/**
 * Disabled all these messages for now by throwing an error, verified it doesn't break portal
 */
export default class TaostatsHandler extends TabsHandler {
  readonly #subHandlers: readonly TabsHandler[]

  constructor(stores: TabStore) {
    super(stores)

    this.#subHandlers = [new RpcHandler(stores)]
  }

  public async handle<TMessageType extends MessageTypes>(
    id: string,
    type: TMessageType,
    request: RequestTypes[TMessageType],
    port: Port,
    url: string,
  ): Promise<ResponseType<TMessageType>> {
    // these methods are pub() because they're exposed to dapps,
    // BUT they're actually only exposed to dapps where isInternalHostname is true
    // which is only dash.taostats.io in production, and also localhost in dev
    if (!isInternalUrl(url)) throw new Error(`Origin not allowed for message type ${type}`)

    switch (type) {
      case "pub(taostats.customSubstrateChains.subscribe)": {
        throw new Error("Not implemented")
        return genericSubscription(
          id,
          port,
          chaindataProvider
            .getNetworks$("polkadot")
            .pipe(map((networks) => networks.filter(isNetworkCustom))),
        )
      }

      case "pub(taostats.customSubstrateChains.unsubscribe)": {
        throw new Error("Not implemented")
        const subId = request as RequestTypes["pub(taostats.customSubstrateChains.unsubscribe)"]
        return unsubscribe(subId)
      }

      case "pub(taostats.customTokens.subscribe)": {
        throw new Error("Not implemented")
        return genericSubscription(
          id,
          port,
          chaindataProvider.tokens$.pipe(map((tokens) => tokens.filter(isTokenCustom))),
        )
      }

      case "pub(taostats.customTokens.unsubscribe)": {
        throw new Error("Not implemented")
        const subId = request as RequestTypes["pub(taostats.customTokens.unsubscribe)"]
        return unsubscribe(subId)
      }

      case "pub(taostats.extension.openPortfolio)": {
        await windowManager.openDashboard({ route: "/portfolio" })
        return true
      }

      default:
        for (const handler of this.#subHandlers) {
          try {
            return handler.handle(id, type, request, port, url)
          } catch {
            continue
          }
        }
        throw new Error(`Unable to handle message of type ${type}`)
    }
  }
}
