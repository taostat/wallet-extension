import type { CrossChainSellRecord } from "./sell-records"
import {
  parseStoredSellRecords,
  SELL_RECORDS_STORAGE_KEY,
  serializeSellRecords,
} from "./sell-records"

/**
 * The saved sells as one page holds them, over storage every page of the wallet shares (the
 * extension's `localStorage`), with each write serialised across pages by a Web Lock.
 *
 * The side panel, the popup and the dashboard are separate documents, possibly in separate
 * renderers, so a read-modify-write in one page isn't atomic against another: two pages could read
 * the same list and the later write would drop the other's change, and both could report the same
 * settlement. So every write runs inside `locks.request(SELL_RECORDS_LOCK_NAME, …)`, re-reads
 * storage there, applies its update and writes, and decides there whether it is the one that
 * settles an order (`applySellOrderState`). Without the Web Locks API, writes run unlocked, as
 * before.
 *
 * SDK-free; nothing here touches `window`: the page passes its storage, its locks and how to listen
 * for other pages' writes.
 */

/** The lock every page takes to write the list: the storage key itself. */
export const SELL_RECORDS_LOCK_NAME = SELL_RECORDS_STORAGE_KEY

/** The slice of `Storage` the store uses. */
export type SellRecordsStorage = {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
}

/** The slice of the Web Locks API (`navigator.locks`) the store uses. */
export type SellRecordsLocks = {
  /** Runs `callback` while holding the lock `name`, alone across every page of the origin. */
  request: <T>(name: string, callback: () => Promise<T>) => Promise<T>
}

export type SellRecordsStoreOptions = {
  /** The shared storage, or `null` when it can't be used (blocked). */
  getStorage: () => SellRecordsStorage | null
  /** The Web Locks API, or `null` where there is none. */
  getLocks: () => SellRecordsLocks | null
  /** Starts listening for other pages' writes (the `storage` event); returns how to stop. */
  listen?: (onChange: () => void) => () => void
  key?: string
  lockName?: string
}

const EMPTY: CrossChainSellRecord[] = []

export type SellRecordsStore = ReturnType<typeof createSellRecordsStore>

export function createSellRecordsStore({
  getStorage,
  getLocks,
  listen,
  key = SELL_RECORDS_STORAGE_KEY,
  lockName = SELL_RECORDS_LOCK_NAME,
}: SellRecordsStoreOptions) {
  /** The list as this page last read or wrote it: what it shows. */
  let snapshot: CrossChainSellRecord[] | null = null
  /**
   * The last write didn't reach storage (unavailable, quota, blocked), so storage holds an older
   * list than this page. Until a write succeeds again, this page's own list is the one to build on.
   */
  let storageBehindSnapshot = false
  const listeners = new Set<() => void>()
  let stopListening: (() => void) | undefined

  const emit = () => listeners.forEach((listener) => listener())

  /** What storage holds now, or `null` when it can't be read. */
  const readStorage = (): CrossChainSellRecord[] | null => {
    const storage = getStorage()
    if (!storage) return null
    try {
      const text = storage.getItem(key)
      return text === null ? EMPTY : parseStoredSellRecords(text)
    } catch {
      return null
    }
  }

  /** The list to build on: storage now, unless it is behind or can't be read. */
  const latest = (): CrossChainSellRecord[] => {
    if (storageBehindSnapshot && snapshot !== null) return snapshot
    return readStorage() ?? snapshot ?? EMPTY
  }

  const persist = (list: CrossChainSellRecord[]) => {
    const storage = getStorage()
    if (!storage) {
      // Unavailable storage is a failed write: the list lives on in this page.
      storageBehindSnapshot = true
      return
    }
    try {
      storage.setItem(key, serializeSellRecords(list))
      storageBehindSnapshot = false
    } catch {
      storageBehindSnapshot = true
    }
  }

  /** Read, update and write in one synchronous step (inside the lock when there is one). */
  const apply = <T extends { list: CrossChainSellRecord[] }>(
    update: (list: CrossChainSellRecord[]) => T,
  ): T => {
    const base = latest()
    const result = update(base)
    if (result.list !== base) {
      persist(result.list)
      snapshot = result.list
      emit()
    }
    return result
  }

  /**
   * Applies `update` to the latest stored list and stores the result when it changed, holding the
   * lock across pages. Resolves to what `update` returned; rejects only if `update` throws.
   */
  const write = async <T extends { list: CrossChainSellRecord[] }>(
    update: (list: CrossChainSellRecord[]) => T,
  ): Promise<T> => {
    const locks = getLocks()
    if (!locks) return apply(update)
    let hasRun = false
    try {
      return await locks.request(lockName, async () => {
        hasRun = true
        return apply(update)
      })
    } catch (error) {
      // The update itself failed: never run it twice.
      if (hasRun) throw error
      // The lock couldn't be had at all: write unlocked rather than not at all.
      return apply(update)
    }
  }

  /** Re-reads storage (another page wrote): never trusts an event's own copy, which may be older. */
  const refresh = () => {
    const next = latest()
    if (next === snapshot) return
    snapshot = next
    emit()
  }

  const getSnapshot = (): CrossChainSellRecord[] => {
    if (snapshot === null) snapshot = latest()
    return snapshot
  }

  /** For `useSyncExternalStore`: listens for other pages' writes while anyone is subscribed. */
  const subscribe = (listener: () => void) => {
    if (listeners.size === 0) {
      // Nobody was listening: another page may have written since.
      snapshot = latest()
      stopListening = listen?.(refresh)
    }
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
      if (listeners.size === 0) {
        stopListening?.()
        stopListening = undefined
      }
    }
  }

  return { getSnapshot, subscribe, refresh, write }
}
