// The SDK-free entrypoint: the sell button and the trackers' host are in the pages' first load.
import { CrossChainEvent } from "@taostats-wallet/cross-chain/config"
import { log } from "extension-shared"

import { api } from "@ui/api"

/**
 * Sends a cross-chain event (built in `@taostats-wallet/cross-chain`'s `analytics.ts`: coarse data
 * only, never an address, a hash, a netuid or an amount) through the wallet's analytics, which
 * honours the user's tracking setting. Analytics never gets in the way of a sell.
 */
export const captureCrossChainEvent = (event: CrossChainEvent) => {
  try {
    api
      .analyticsCapture({ eventName: event.name, options: event.data })
      .catch((error) => log.debug("[cross-chain] Analytics event not sent", { error }))
  } catch (error) {
    log.debug("[cross-chain] Analytics event not sent", { error })
  }
}
