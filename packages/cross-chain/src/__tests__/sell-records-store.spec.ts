import type { SellRecordsLocks, SellRecordsStorage } from "../sell-records-store"
import {
  applySellOrderState,
  openedSellRecord,
  parseStoredSellRecords,
  SELL_RECORDS_STORAGE_KEY,
  serializeSellRecords,
  upsertSellRecord,
} from "../sell-records"
import { createSellRecordsStore, SELL_RECORDS_LOCK_NAME } from "../sell-records-store"

const hash = (n: number): `0x${string}` => `0x${n.toString(16).padStart(64, "0")}`
const NOW = 1_793_000_000_000

const record = (n: number) =>
  openedSellRecord({
    address: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
    from: { kind: "tao" },
    to: "USDC",
    amountInRaw: 1_000_000_000n,
    amountOutRaw: 400_000_000n,
    recipient: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
    extrinsicHash: hash(n),
    order: { orderId: hash(1000 + n), originChainId: 964, destinationChainId: 1, fillDeadline: 1 },
    now: NOW + n,
  })

/** `localStorage` as every page of the origin shares it. */
const createStorage = () => {
  const items = new Map<string, string>()
  const storage: SellRecordsStorage & { stored: () => ReturnType<typeof parseStoredSellRecords> } =
    {
      getItem: (key) => items.get(key) ?? null,
      setItem: (key, value) => void items.set(key, value),
      stored: () => parseStoredSellRecords(items.get(SELL_RECORDS_STORAGE_KEY) ?? null),
    }
  return storage
}

/**
 * The Web Locks API as the browser runs it: one holder at a time per name, granted in request
 * order, each callback starting on a later task (here, a later microtask), so writes asked for
 * together are queued, not run inline.
 */
const createLocks = () => {
  let queue: Promise<unknown> = Promise.resolve()
  const state = { held: false, granted: 0 }
  const locks: SellRecordsLocks = {
    request: <T>(name: string, callback: () => Promise<T>) => {
      expect(name).toBe(SELL_RECORDS_LOCK_NAME)
      const run = queue.then(async () => {
        state.held = true
        state.granted++
        try {
          return await callback()
        } finally {
          state.held = false
        }
      })
      queue = run.catch(() => undefined)
      return run
    },
  }
  return { locks, state }
}

/** One page of the wallet: its own store over the shared storage and locks. */
const createPage = (
  storage: SellRecordsStorage | null,
  locks: SellRecordsLocks | null,
  listen?: (onChange: () => void) => () => void,
) => createSellRecordsStore({ getStorage: () => storage, getLocks: () => locks, listen })

describe("writes across pages", () => {
  it("writes only while holding the lock, re-reading storage there", async () => {
    const storage = createStorage()
    const { locks, state } = createLocks()
    const setItem = storage.setItem
    storage.setItem = (key, value) => {
      expect(state.held).toBe(true)
      setItem(key, value)
    }
    const sidePanel = createPage(storage, locks)
    const dashboard = createPage(storage, locks)
    // The dashboard read the list before the side panel wrote.
    expect(dashboard.getSnapshot()).toEqual([])

    await sidePanel.write((list) => ({ list: upsertSellRecord(list, record(1)) }))
    await dashboard.write((list) => ({ list: upsertSellRecord(list, record(2)) }))

    expect(storage.stored().map((r) => r.id)).toEqual([record(2).id, record(1).id])
    expect(dashboard.getSnapshot().map((r) => r.id)).toEqual([record(2).id, record(1).id])
    expect(state.granted).toBe(2)
  })

  it("keeps both of two updates asked for at once by two pages", async () => {
    const storage = createStorage()
    const { locks } = createLocks()
    const sidePanel = createPage(storage, locks)
    const dashboard = createPage(storage, locks)
    sidePanel.getSnapshot()
    dashboard.getSnapshot()

    await Promise.all([
      sidePanel.write((list) => ({ list: upsertSellRecord(list, record(1)) })),
      dashboard.write((list) => ({ list: upsertSellRecord(list, record(2)) })),
      sidePanel.write((list) => ({ list: upsertSellRecord(list, record(3)) })),
    ])

    expect(
      storage
        .stored()
        .map((r) => r.id)
        .sort(),
    ).toEqual([record(1).id, record(2).id, record(3).id].sort())
  })

  it("lets only one page report a settlement both of them saw", async () => {
    const storage = createStorage()
    storage.setItem(SELL_RECORDS_STORAGE_KEY, serializeSellRecords([record(1)]))
    const { locks } = createLocks()
    const sidePanel = createPage(storage, locks)
    const dashboard = createPage(storage, locks)

    const results = await Promise.all([
      sidePanel.write((list) => applySellOrderState(list, record(1).id, "filled", NOW)),
      dashboard.write((list) => applySellOrderState(list, record(1).id, "filled", NOW)),
    ])

    expect(results.filter((result) => result.settles)).toHaveLength(1)
    expect(storage.stored()[0]).toMatchObject({ status: "filled", reported: true })
  })

  it("writes unlocked where there is no Web Locks API", async () => {
    const storage = createStorage()
    const page = createPage(storage, null)
    await page.write((list) => ({ list: upsertSellRecord(list, record(1)) }))
    expect(storage.stored()).toEqual([record(1)])
  })

  it("writes unlocked, once, when the lock can't be had", async () => {
    const storage = createStorage()
    const locks: SellRecordsLocks = { request: () => Promise.reject(new Error("SecurityError")) }
    const update = jest.fn((list: ReturnType<typeof storage.stored>) => ({
      list: upsertSellRecord(list, record(1)),
    }))
    await createPage(storage, locks).write(update)
    expect(update).toHaveBeenCalledTimes(1)
    expect(storage.stored()).toEqual([record(1)])
  })

  it("never runs an update twice when the update itself fails", async () => {
    const storage = createStorage()
    const { locks } = createLocks()
    const update = jest.fn(() => {
      throw new Error("boom")
    })
    await expect(createPage(storage, locks).write(update)).rejects.toThrow("boom")
    expect(update).toHaveBeenCalledTimes(1)
  })
})

describe("storage that can't be written", () => {
  it("keeps building on this page's list while storage is unavailable", async () => {
    const page = createPage(null, createLocks().locks)
    await page.write((list) => ({ list: upsertSellRecord(list, record(1)) }))
    await page.write((list) => ({ list: upsertSellRecord(list, record(2)) }))
    expect(page.getSnapshot().map((r) => r.id)).toEqual([record(2).id, record(1).id])
  })

  it("keeps building on this page's list after a write fails (quota)", async () => {
    const storage = createStorage()
    const page = createPage(storage, createLocks().locks)
    await page.write((list) => ({ list: upsertSellRecord(list, record(1)) }))
    storage.setItem = () => {
      throw new Error("QuotaExceededError")
    }
    await page.write((list) => ({ list: upsertSellRecord(list, record(2)) }))
    await page.write((list) => ({ list: upsertSellRecord(list, record(3)) }))
    expect(page.getSnapshot().map((r) => r.id)).toEqual([record(3).id, record(2).id, record(1).id])
  })
})

describe("other pages' writes", () => {
  it("re-reads storage on a change, whatever the event carried", async () => {
    const storage = createStorage()
    let onChange: (() => void) | undefined
    const listen = jest.fn((callback: () => void) => {
      onChange = callback
      return () => {
        onChange = undefined
      }
    })
    const { locks } = createLocks()
    const dashboard = createPage(storage, locks, listen)
    const sidePanel = createPage(storage, locks)
    const listener = jest.fn()
    const unsubscribe = dashboard.subscribe(listener)
    expect(listen).toHaveBeenCalledTimes(1)

    await sidePanel.write((list) => ({ list: upsertSellRecord(list, record(1)) }))
    await sidePanel.write((list) => ({ list: upsertSellRecord(list, record(2)) }))
    // Both writes' events arrive late: each reads what storage holds now, the newest list.
    onChange?.()
    onChange?.()
    expect(dashboard.getSnapshot().map((r) => r.id)).toEqual([record(2).id, record(1).id])
    expect(listener).toHaveBeenCalled()

    unsubscribe()
    expect(onChange).toBeUndefined()
  })

  it("keeps its own list on a change while its writes don't reach storage", async () => {
    const storage = createStorage()
    const page = createPage(storage, null)
    storage.setItem = () => {
      throw new Error("QuotaExceededError")
    }
    await page.write((list) => ({ list: upsertSellRecord(list, record(1)) }))
    page.refresh()
    expect(page.getSnapshot()).toEqual([record(1)])
  })
})
