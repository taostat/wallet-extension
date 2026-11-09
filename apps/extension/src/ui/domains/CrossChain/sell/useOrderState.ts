import {
  CrossChainConfig,
  Order,
  OrderState,
  orderWatchOptions,
} from "@taostats-wallet/cross-chain"
import { log } from "extension-shared"
import { useEffect, useState } from "react"

/**
 * The open order's state while this screen is open: `order.watch` polls the chains (two reads a
 * check, at the config's interval) and stops by itself once the order is filled or refunded.
 * Nothing follows it after the modal closes; the order is delivered or refunded on its own anyway.
 */
export const useOrderState = (order: Order | undefined, config: CrossChainConfig): OrderState => {
  const [state, setState] = useState<OrderState>("open")

  // A subscription to the chains, outside React: started for an order, stopped on unmount.
  useEffect(() => {
    if (!order) return
    return order.watch((status) => setState(status.state), {
      ...orderWatchOptions(config),
      onError: (error) => log.debug("[cross-chain] Order status check failed", { error }),
    })
  }, [order, config])

  return state
}
