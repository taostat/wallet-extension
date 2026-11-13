import {
  CrossChainConfig,
  CrossChainSellRecord,
  DEFAULT_CROSS_CHAIN_CONFIG,
  isSettledOrderState,
  orderWatchOptions,
  sellAnalyticsContext,
  swapSettledEvent,
} from "@taostats-wallet/cross-chain"
import { formatDecimals } from "@taostats-wallet/util"
import { log } from "extension-shared"
import { FC, useCallback, useEffect } from "react"
import { useTranslation } from "react-i18next"

import { notify } from "@taostats/components/Notifications"
import { useSettingValue } from "@ui/state"

import { captureCrossChainEvent } from "../crossChainAnalytics"
import { useCrossChainConfig } from "../crossChainSellGate"
import { applyCrossChainSellOrderState } from "../records/sellRecordsStore"
import { getTaoIntents } from "../sell/intents"
import { showCrossChainSystemNotification } from "./crossChainNotices"

/** Long enough to read a sentence. */
const SETTLED_TOAST_MS = 8_000

/**
 * One headless tracker per order `CrossChainOrderTrackers` hands it (this page's share: all of them
 * on the page that leads the tracking), each following it with the SDK's `order.watch` at the
 * config's interval and writing every state to the saved sells, which the sell modal and Recent
 * swaps of every page read. Loaded only while there is something to follow. A settled order is told
 * once per browser: by the page whose write, under the lock every page writes under, settled it
 * (`applySellOrderState`).
 */
const OrderTrackers: FC<{ records: CrossChainSellRecord[] }> = ({ records }) => {
  const { data } = useCrossChainConfig()
  const config = data?.config ?? DEFAULT_CROSS_CHAIN_CONFIG
  const onSettled = useSettledNotice()

  return (
    <>
      {records.map((record) => (
        <OrderTracker key={record.id} record={record} config={config} onSettled={onSettled} />
      ))}
    </>
  )
}

export default OrderTrackers

type OnSettled = (record: CrossChainSellRecord, state: "filled" | "refunded") => void

const OrderTracker: FC<{
  record: CrossChainSellRecord
  config: CrossChainConfig
  onSettled: OnSettled
}> = ({ record, config, onSettled }) => {
  const { id, order } = record
  const orderId = order?.orderId
  const originChainId = order?.originChainId
  const destinationChainId = order?.destinationChainId
  const fillDeadline = order?.fillDeadline

  // A subscription to the chains, outside React: started for an unfinished order, stopped when it
  // settles (the SDK stops by itself), when the order changes, and on unmount.
  useEffect(() => {
    if (
      orderId === undefined ||
      originChainId === undefined ||
      destinationChainId === undefined ||
      fillDeadline === undefined
    )
      return
    let hasReported = false
    const watched = getTaoIntents(config).getOrder({
      orderId,
      originChainId,
      destinationChainId,
      fillDeadline,
    })
    return watched.watch(
      (status) => {
        const { state } = status
        // Written under the cross-page lock, where it is decided which page reports it.
        applyCrossChainSellOrderState(id, state)
          .then(({ settles, list }) => {
            if (!settles || hasReported || !isSettledOrderState(state)) return
            hasReported = true
            const settled = list.find((item) => item.id === id)
            if (settled) onSettled(settled, state)
          })
          .catch((error) => log.error("[cross-chain] Couldn't save the order's state", { error }))
      },
      {
        ...orderWatchOptions(config),
        // A failed check writes nothing: the record keeps its state. SDK 1.5.1 reads an order on the
        // contract each chain runs now, so one opened before TAO.com's move to new contracts
        // (2026-11-12) gets ORDER_NOT_FOUND on every check and stays as it is.
        onError: (error) => log.debug("[cross-chain] Order status check failed", { error }),
      },
    )
  }, [config, destinationChainId, fillDeadline, id, onSettled, orderId, originChainId])

  return null
}

/** Tells the user once a sell settled: a toast here, a system notification, and analytics. */
const useSettledNotice = (): OnSettled => {
  const { t } = useTranslation()
  const allowNotifications = useSettingValue("allowNotifications")

  return useCallback(
    (record, state) => {
      try {
        if (state === "filled") {
          const amount = record.amountOut
            ? `${formatDecimals(Number(record.amountOut))} ${record.to}`
            : record.to
          const text = t("Swap delivered: {{amount}} on {{network}}.", {
            amount,
            network: "Ethereum",
          })
          notify({ type: "success", title: text }, { autoClose: SETTLED_TOAST_MS })
          if (allowNotifications)
            showCrossChainSystemNotification({
              id: record.id,
              title: t("Swap delivered"),
              message: text,
            })
        } else {
          const text = t("A cross-chain swap wasn't filled in time and was refunded as USDC.")
          const action = t("Move it to an address you control from Recent cross-chain swaps.")
          notify({ type: "warn", title: text, subtitle: action }, { autoClose: SETTLED_TOAST_MS })
          if (allowNotifications)
            showCrossChainSystemNotification({
              id: record.id,
              title: t("Swap needs attention"),
              message: `${text} ${action}`,
            })
        }
      } catch (error) {
        log.debug("[cross-chain] Settled notice not shown", { error })
      }
      captureCrossChainEvent(swapSettledEvent(sellAnalyticsContext(record), state))
    },
    [allowNotifications, t],
  )
}
