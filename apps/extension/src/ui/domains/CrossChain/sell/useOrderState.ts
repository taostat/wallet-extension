import {
  CrossChainConfig,
  isSettledOrderState,
  Order,
  OrderState,
  orderWatchOptions,
} from "@taostats-wallet/cross-chain"
import { log } from "extension-shared"
import { useEffect, useState } from "react"

import { useCrossChainSellRecord } from "../records/sellRecordsStore"

/**
 * The open order's state. From its saved record when there is one: the page's
 * `CrossChainOrderTrackers` follows it (`order.watch`, two reads a check at the config's interval)
 * and writes each state there, so this screen and Recent swaps agree, and the order is followed on
 * after the modal closes. Without a record (it couldn't be saved), this screen watches the order
 * itself while it is open.
 */
export const useOrderState = (
  recordId: string | undefined,
  order: Order | undefined,
  config: CrossChainConfig,
): OrderState => {
  const record = useCrossChainSellRecord(recordId)
  const [watched, setWatched] = useState<OrderState>("open")

  // A subscription to the chains, outside React: only without a record, stopped on unmount.
  useEffect(() => {
    if (recordId !== undefined || !order) return
    return order.watch((status) => setWatched(status.state), {
      ...orderWatchOptions(config),
      onError: (error) => log.debug("[cross-chain] Order status check failed", { error }),
    })
  }, [config, order, recordId])

  if (recordId === undefined) return watched
  const status = record?.status
  if (status === "awaiting-refund" || (status !== undefined && isSettledOrderState(status)))
    return status
  return "open"
}
