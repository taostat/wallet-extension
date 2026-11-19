// The SDK-free entrypoint: this host is in the side panel's and dashboard's first load.
import {
  CrossChainSellRecord,
  nextTrackingChange,
  sellsToTrack,
  trackedSellsFor,
} from "@taostats-wallet/cross-chain/config"
import { FC, lazy, Suspense, useEffect, useState } from "react"

import { useIsCrossChainSellEnabled } from "./crossChainSellGate"
import { useCrossChainSells, useIsRecentSwapsOpen } from "./records/sellRecordsStore"

// Its own chunk, with the swap SDK: loaded only while there is an order to follow. Written inline
// (not via IS_CROSS_CHAIN_SELL_BUILD) so webpack sees a constant and leaves the chunk out of builds
// with sells off.
const OrderTrackers =
  process.env.CROSS_CHAIN_SELL === "true" ? lazy(() => import("./tracking/OrderTrackers")) : null

/** The Web Lock the page that follows the orders holds, for as long as it does. */
const TRACKERS_LOCK_NAME = "crossChainTrackers"

/** setTimeout's longest delay. */
const MAX_TIMER_MS = 2 ** 31 - 1

/**
 * Follows this browser's unfinished cross-chain sells after their modal closes, until they are
 * delivered or refunded, and tells the user once. Mounted once in the side panel / popup and once
 * in the dashboard, next to `CrossChainSellModal`.
 *
 * - Renders nothing, and loads nothing, unless a saved order is still likely to move (a fill
 *   deadline ahead or less than an hour past; any unfinished one while Recent swaps is open), and
 *   only then asks whether sells are on (build and our API). The cutoff is checked again when the
 *   next one comes, so an order that never settles stops being polled on an idle page too.
 * - One page follows them for the whole browser: the one holding the `crossChainTrackers` Web Lock.
 *   The others queue for it and take over when that page closes, so the orders aren't polled once
 *   per open page (keyless Blockmachine allows 60 requests a minute per IP). Without the Web Locks
 *   API, every page follows them, as before. Every page's screens read the saved sells, which the
 *   leading page writes.
 */
export const CrossChainOrderTrackers = () => (OrderTrackers ? <TrackersHost /> : null)

const TrackersHost = () => {
  const records = useCrossChainSells()
  const isRecentOpen = useIsRecentSwapsOpen()
  const nowSeconds = useTrackingClock(records)
  const hasOrders = sellsToTrack(records, { nowSeconds, includeAll: isRecentOpen }).length > 0
  return hasOrders ? (
    <GatedTrackers records={records} nowSeconds={nowSeconds} isRecentOpen={isRecentOpen} />
  ) : null
}

const GatedTrackers: FC<{
  records: CrossChainSellRecord[]
  nowSeconds: number
  isRecentOpen: boolean
}> = ({ records, nowSeconds, isRecentOpen }) => {
  const isEnabled = useIsCrossChainSellEnabled()
  const isLeader = useIsTrackingLeader(isEnabled)
  if (!isEnabled || !OrderTrackers) return null
  const tracked = trackedSellsFor(records, { nowSeconds, isRecentOpen, isLeader })
  if (tracked.length === 0) return null
  return (
    <Suspense fallback={null}>
      <OrderTrackers records={tracked} />
    </Suspense>
  )
}

/**
 * The time to decide what to follow by, in seconds; renders again when the next cutoff passes
 * (`nextTrackingChange`). A timer outside React, one at a time, cleared on unmount.
 */
const useTrackingClock = (records: CrossChainSellRecord[]) => {
  const [, setTick] = useState(0)
  const nowSeconds = Math.floor(Date.now() / 1000)
  const nextChange = nextTrackingChange(records, nowSeconds)

  useEffect(() => {
    if (nextChange === undefined) return
    // A second past the cutoff, so the next render is past it.
    const delay = Math.min(MAX_TIMER_MS, Math.max(0, nextChange * 1000 - Date.now()) + 1_000)
    const timer = setTimeout(() => setTick((tick) => tick + 1), delay)
    return () => clearTimeout(timer)
  }, [nextChange])

  return nowSeconds
}

/**
 * Whether this page leads the tracking: it holds the `crossChainTrackers` Web Lock, asked for while
 * `wanted` and held until then (the browser frees it when the page closes, and the next page in the
 * queue gets it). Without the Web Locks API, every page leads.
 */
const useIsTrackingLeader = (wanted: boolean) => {
  const locks = typeof navigator === "undefined" ? undefined : navigator.locks
  const [isHolder, setIsHolder] = useState(false)

  // A lock held across the browser's pages, outside React: asked for, held while wanted, released
  // (or the request dropped) on unmount.
  useEffect(() => {
    if (!wanted || !locks) return
    const controller = new AbortController()
    let release = () => {}
    const held = new Promise<void>((resolve) => {
      release = resolve
    })
    locks
      .request(TRACKERS_LOCK_NAME, { signal: controller.signal }, async () => {
        setIsHolder(true)
        await held
      })
      .catch(() => {
        // Dropped while queued: this page stopped wanting it.
      })
    return () => {
      controller.abort()
      release()
      setIsHolder(false)
    }
  }, [locks, wanted])

  return !locks || isHolder
}
