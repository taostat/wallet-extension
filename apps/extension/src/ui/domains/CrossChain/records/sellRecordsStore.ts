// The SDK-free entrypoint: this module is in the side panel's and dashboard's first load.
import {
  applySellOrderState,
  createSellRecordsStore,
  CrossChainSellRecord,
  discardUnresolvedSell,
  markSellRefundsMoved,
  markStrandedAlphaReturned,
  mergeSellRecord,
  resolveUnconfirmedSell,
  SELL_RECORDS_STORAGE_KEY,
  SellOrderState,
  SellRecordsLocks,
  UnconfirmedSellOutcome,
} from "@taostats-wallet/cross-chain/config"
import { isAddressEqual } from "@taostats-wallet/crypto"
import { useEffect, useSyncExternalStore } from "react"

/**
 * This browser's cross-chain sells (`@taostats-wallet/cross-chain`'s `sell-records.ts`), shared by
 * every page of the wallet: the side panel, the popup and the dashboard.
 *
 * Kept in the extension's `localStorage`, read through `parseStoredSellRecords` (corrupt or old data
 * reads as an empty or shorter list), and kept in step between open pages by the `storage` event,
 * on which each page re-reads storage. Not the service worker's stores: only the pages use it.
 *
 * The pages are separate documents (possibly separate renderers), so a write isn't atomic across
 * them by itself: every write takes the `crossChainSells:v1` Web Lock (`navigator.locks`), re-reads
 * storage inside it, applies its update and writes (`createSellRecordsStore`). That is what keeps
 * two pages' changes from dropping each other's, and makes the settle-once rule hold
 * (`applySellOrderState`): only the write that moves an order to filled or refunded reports it.
 */

const getStorage = (): Storage | null => {
  try {
    return typeof window === "undefined" ? null : window.localStorage
  } catch {
    // Blocked storage.
    return null
  }
}

const getLocks = (): SellRecordsLocks | null => {
  const locks = typeof navigator === "undefined" ? undefined : navigator.locks
  if (!locks) return null
  return { request: (name, callback) => locks.request(name, () => callback()) }
}

/** Calls `onChange` when another page writes the list (or clears the storage: `key` is null). */
const listenForOtherPages = (onChange: () => void) => {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== SELL_RECORDS_STORAGE_KEY) return
    if (event.storageArea !== getStorage()) return
    onChange()
  }
  window.addEventListener("storage", onStorage)
  return () => window.removeEventListener("storage", onStorage)
}

const store = createSellRecordsStore({ getStorage, getLocks, listen: listenForOtherPages })

/**
 * Applies `update` to the latest stored list, inside the lock every page writes under, and stores
 * the result when it changed. Resolves to what `update` returned.
 */
export const writeCrossChainSells = store.write

/** Every saved sell, newest first. */
export const useCrossChainSells = () => useSyncExternalStore(store.subscribe, store.getSnapshot)

/** One saved sell, by id. */
export const useCrossChainSellRecord = (id: string | undefined) => {
  const records = useCrossChainSells()
  return id === undefined ? undefined : records.find((record) => record.id === id)
}

/**
 * Save what a sell's run learned: a new sell, or merged into its record without undoing what
 * another page learned since (`mergeSellRecord`: never back to unconfirmed, never resetting a
 * settlement or a report).
 */
export const saveCrossChainSell = (record: CrossChainSellRecord) =>
  writeCrossChainSells((list) => ({ list: mergeSellRecord(list, record) }))

/**
 * Forget a sell that moved nothing (a rolled-back batch, or an unconfirmed send the user removed),
 * unless another page has since found that it did (`discardUnresolvedSell`).
 */
export const removeCrossChainSell = (id: string) =>
  writeCrossChainSells((list) => ({ list: discardUnresolvedSell(list, id) }))

/** A state the order was seen in; `settles` for the one write (in any page) that should report it. */
export const applyCrossChainSellOrderState = (id: string, state: SellOrderState) =>
  writeCrossChainSells((list) => applySellOrderState(list, id, state, Date.now()))

/** An unconfirmed send found; `resolved` for the one write that should report it. */
export const resolveCrossChainUnconfirmedSell = (id: string, outcome: UnconfirmedSellOutcome) =>
  writeCrossChainSells((list) => resolveUnconfirmedSell(list, id, outcome))

/**
 * The refunded sells of `address` whose refund a move covered (or a read found gone): those this
 * wallet saw land by `settledBy` (ms), when the balance was read at the earliest.
 */
export const markCrossChainRefundsMoved = (
  address: string,
  move: NonNullable<CrossChainSellRecord["refundMove"]>,
  settledBy: number,
) =>
  writeCrossChainSells((list) => ({
    list: markSellRefundsMoved(list, { address, move, isSameAddress: isAddressEqual, settledBy }),
  }))

/** Every sell that left alpha at `address`'s mirror on `netuid` and `hotkey` returned. */
export const markCrossChainAlphaReturned = (
  address: string,
  { netuid, hotkey }: { netuid: number; hotkey: string },
  returned: NonNullable<NonNullable<CrossChainSellRecord["strandedAlpha"]>["returned"]>,
) =>
  writeCrossChainSells((list) => ({
    list: markStrandedAlphaReturned(list, {
      address,
      netuid,
      hotkey,
      returned,
      isSameAddress: isAddressEqual,
    }),
  }))

// ------------------------------------------------------------------- Recent swaps open

/** How many Recent swaps views are mounted in this page (a count, so a remount can't leave it wrong). */
let recentSwapsOpen = 0
const recentListeners = new Set<() => void>()

const setRecentSwapsOpen = (count: number) => {
  recentSwapsOpen = Math.max(0, count)
  recentListeners.forEach((listener) => listener())
}

const subscribeRecent = (listener: () => void) => {
  recentListeners.add(listener)
  return () => {
    recentListeners.delete(listener)
  }
}

/** Recent swaps is open in this page: every unfinished order is followed, not only recent ones. */
export const useIsRecentSwapsOpen = () =>
  useSyncExternalStore(subscribeRecent, () => recentSwapsOpen > 0)

/** Marks Recent swaps as open while the calling view is mounted (a flag outside React). */
export const useMarkRecentSwapsOpen = () => {
  useEffect(() => {
    setRecentSwapsOpen(recentSwapsOpen + 1)
    return () => setRecentSwapsOpen(recentSwapsOpen - 1)
  }, [])
}

// ------------------------------------------------------------------- sells in flight

/**
 * Sells this page is sending right now: saved as unconfirmed as soon as they are signed, but not yet
 * something to ask the user about (their run is still deciding).
 */
let inFlight: ReadonlySet<string> = new Set()
const inFlightListeners = new Set<() => void>()

export const setSellInFlight = (id: string, isInFlight: boolean) => {
  if (inFlight.has(id) === isInFlight) return
  const next = new Set(inFlight)
  if (isInFlight) next.add(id)
  else next.delete(id)
  inFlight = next
  inFlightListeners.forEach((listener) => listener())
}

const subscribeInFlight = (listener: () => void) => {
  inFlightListeners.add(listener)
  return () => {
    inFlightListeners.delete(listener)
  }
}

/** The ids of the sells this page is still sending. */
export const useSellsInFlight = () => useSyncExternalStore(subscribeInFlight, () => inFlight)
