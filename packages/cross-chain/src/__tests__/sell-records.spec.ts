import type { CrossChainSellRecord, SellOrderRef } from "../sell-records"
import {
  applySellOrderState,
  discardUnresolvedSell,
  markSellRefundsMoved,
  markStrandedAlphaReturned,
  mergeSellRecord,
  nextTrackingChange,
  openedSellRecord,
  parseSellRecord,
  parseStoredSellRecords,
  removeSellRecord,
  resolveUnconfirmedSell,
  SELL_RECORD_VERSION,
  SELL_RECORDS_LIMIT,
  SELL_RECORDS_STORAGE_KEY,
  sellAttention,
  sellRecordId,
  sellsNeedingAttention,
  sellsToTrack,
  serializeSellRecords,
  strandedSellRecord,
  strandedSellRecordId,
  TRACK_GRACE_SECONDS,
  trackedSellsFor,
  unconfirmedSellRecord,
  upsertSellRecord,
} from "../sell-records"

const hash = (n: number): `0x${string}` => `0x${n.toString(16).padStart(64, "0")}`
const NOW = 1_793_000_000_000
const NOW_S = NOW / 1000
const ALICE = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
const BOB = "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty"
const RECIPIENT = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
const HOTKEY = "5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy"

const order = (n: number, fillDeadline = NOW_S + 300): SellOrderRef => ({
  orderId: hash(1000 + n),
  originChainId: 964,
  destinationChainId: 1,
  fillDeadline,
})

const base = {
  address: ALICE,
  from: { kind: "tao" } as const,
  to: "USDC" as const,
  amountInRaw: 1_500_000_000n, // 1.5 TAO
  amountOutRaw: 612_340_000n, // 612.34 USDC
  recipient: RECIPIENT,
  now: NOW,
}

const opened = (
  n: number,
  overrides: Partial<CrossChainSellRecord> = {},
): CrossChainSellRecord => ({
  ...openedSellRecord({ ...base, extrinsicHash: hash(n), order: order(n), now: NOW + n }),
  ...overrides,
})

describe("building records", () => {
  it("keeps an opened sell with its order, amounts as dot-decimal, unreported", () => {
    const record = openedSellRecord({
      ...base,
      extrinsicHash: `0x${"AB".repeat(32)}`,
      order: { ...order(1), openTxHash: undefined } as SellOrderRef,
      symbol: "TAO",
      usdBucket: "100-1k",
    })
    expect(record).toEqual({
      version: SELL_RECORD_VERSION,
      id: `0x${"ab".repeat(32)}`,
      extrinsicHash: `0x${"AB".repeat(32)}`,
      status: "open",
      order: order(1),
      address: ALICE,
      from: { kind: "tao" },
      to: "USDC",
      amountIn: "1.5",
      amountOut: "612.34",
      recipient: RECIPIENT,
      createdAt: NOW,
      reported: false,
      symbol: "TAO",
      usdBucket: "100-1k",
    })
  })

  it("writes ETH with 18 decimals", () => {
    const record = openedSellRecord({
      ...base,
      to: "ETH",
      amountOutRaw: 250_000_000_000_000_000n,
      extrinsicHash: hash(1),
      order: order(1),
    })
    expect(record.amountOut).toBe("0.25")
  })

  it("keeps an unconfirmed send by its hash, with no order", () => {
    const record = unconfirmedSellRecord({ ...base, extrinsicHash: hash(2) })
    expect(record.status).toBe("unconfirmed")
    expect(record.order).toBeUndefined()
    expect(record.id).toBe(sellRecordId(hash(2)))
  })

  it("keeps stranded alpha by its hash, or by account, subnet and hotkey without one", () => {
    const alpha = { kind: "alpha", netuid: 64, hotkey: HOTKEY } as const
    const stranded = { netuid: 64, hotkey: hash(77) }
    const withHash = strandedSellRecord({
      ...base,
      from: alpha,
      extrinsicHash: hash(3),
      strandedAlpha: stranded,
    })
    expect(withHash).toMatchObject({ id: hash(3), status: "notOpened", strandedAlpha: stranded })
    const withoutHash = strandedSellRecord({ ...base, from: alpha, strandedAlpha: stranded })
    expect(withoutHash.id).toBe(strandedSellRecordId({ address: ALICE, ...stranded }))
    expect(withoutHash.extrinsicHash).toBeUndefined()
  })

  it("stores under a versioned key", () => {
    expect(SELL_RECORDS_STORAGE_KEY).toBe("crossChainSells:v1")
  })
})

describe("the list", () => {
  it("keeps the newest first and replaces a record by id", () => {
    const a = opened(1)
    const b = opened(2)
    const list = upsertSellRecord(upsertSellRecord([], a), b)
    expect(list.map((r) => r.id)).toEqual([b.id, a.id])
    const replaced = upsertSellRecord(list, { ...a, status: "filled" })
    expect(replaced).toHaveLength(2)
    expect(replaced.find((r) => r.id === a.id)?.status).toBe("filled")
  })

  it("an opened order replaces its unconfirmed send (same extrinsic)", () => {
    const unconfirmed = unconfirmedSellRecord({ ...base, extrinsicHash: hash(5) })
    const list = upsertSellRecord(
      [unconfirmed],
      openedSellRecord({ ...base, extrinsicHash: hash(5), order: order(5) }),
    )
    expect(list).toHaveLength(1)
    expect(list[0].status).toBe("open")
  })

  it("over the limit drops the oldest records that need nothing, never one that needs the user", () => {
    const stranded = strandedSellRecord({
      ...base,
      now: 0, // the oldest of all
      from: { kind: "alpha", netuid: 3, hotkey: HOTKEY },
      extrinsicHash: hash(9999),
      strandedAlpha: { netuid: 3, hotkey: hash(5) },
    })
    let list: CrossChainSellRecord[] = [stranded]
    for (let i = 1; i <= SELL_RECORDS_LIMIT + 5; i++)
      list = upsertSellRecord(list, opened(i, { status: "filled" }))
    expect(list).toHaveLength(SELL_RECORDS_LIMIT)
    expect(list.some((r) => r.id === stranded.id)).toBe(true)
    expect(list.some((r) => r.id === opened(1).id)).toBe(false)
    // Newest first.
    expect(list[0].id).toBe(opened(SELL_RECORDS_LIMIT + 5).id)
    expect(list[list.length - 1].id).toBe(stranded.id)
  })

  it("removes a record, and returns the list itself when it isn't there", () => {
    const list = [opened(1), opened(2)]
    expect(removeSellRecord(list, opened(1).id)).toEqual([opened(2)])
    expect(removeSellRecord(list, "nope")).toBe(list)
  })
})

describe("settling once", () => {
  it("settles an open order once: stamps settledAt and reported, and says so to that write only", () => {
    const list = [opened(1)]
    const first = applySellOrderState(list, opened(1).id, "filled", NOW + 60_000)
    expect(first.settles).toBe(true)
    expect(first.list[0]).toMatchObject({
      status: "filled",
      settledAt: NOW + 60_000,
      reported: true,
    })
    // Another page writing the same state later: nothing changes, nothing to report.
    const second = applySellOrderState(first.list, opened(1).id, "filled", NOW + 90_000)
    expect(second.settles).toBe(false)
    expect(second.list).toBe(first.list)
  })

  it("never reports a record already reported, nor moves a final state back", () => {
    const reported = [opened(1, { reported: true, status: "awaiting-refund" })]
    expect(applySellOrderState(reported, opened(1).id, "refunded", NOW).settles).toBe(false)
    const filled = [opened(1, { status: "filled", reported: true })]
    const result = applySellOrderState(filled, opened(1).id, "open", NOW)
    expect(result.list).toBe(filled)
  })

  it("records a state that isn't final without reporting it", () => {
    const result = applySellOrderState([opened(1)], opened(1).id, "awaiting-refund", NOW)
    expect(result.settles).toBe(false)
    expect(result.list[0]).toMatchObject({ status: "awaiting-refund", reported: false })
    expect(result.list[0].settledAt).toBeUndefined()
  })

  it("does nothing for an unknown record, or one without an order", () => {
    const list = [unconfirmedSellRecord({ ...base, extrinsicHash: hash(4) })]
    expect(applySellOrderState(list, hash(4), "filled", NOW)).toEqual({ list, settles: false })
    expect(applySellOrderState(list, "other", "filled", NOW)).toEqual({ list, settles: false })
  })
})

describe("an unconfirmed send resolved", () => {
  const unconfirmed = unconfirmedSellRecord({
    ...base,
    from: { kind: "alpha", netuid: 8, hotkey: HOTKEY },
    extrinsicHash: hash(6),
  })

  it("becomes an open order, reported by the write that resolved it only", () => {
    const first = resolveUnconfirmedSell([unconfirmed], unconfirmed.id, {
      kind: "opened",
      order: order(6),
    })
    expect(first.resolved).toBe(true)
    expect(first.list[0]).toMatchObject({ status: "open", order: order(6) })
    const again = resolveUnconfirmedSell(first.list, unconfirmed.id, {
      kind: "opened",
      order: order(6),
    })
    expect(again).toEqual({ list: first.list, resolved: false })
  })

  it("keeps where alpha was left when the swap didn't open", () => {
    const { list } = resolveUnconfirmedSell([unconfirmed], unconfirmed.id, {
      kind: "notOpened",
      strandedAlpha: { netuid: 8, hotkey: hash(9) },
    })
    expect(list[0]).toMatchObject({
      status: "notOpened",
      strandedAlpha: { netuid: 8, hotkey: hash(9) },
    })
    expect(sellAttention(list[0])).toBe("returnAlpha")
  })

  it("needs nothing once it is known never to have been included", () => {
    const { list } = resolveUnconfirmedSell([unconfirmed], unconfirmed.id, { kind: "notIncluded" })
    expect(list[0].status).toBe("notIncluded")
    expect(sellAttention(list[0])).toBeNull()
  })
})

describe("attention", () => {
  const stranded = strandedSellRecord({
    ...base,
    from: { kind: "alpha", netuid: 64, hotkey: HOTKEY },
    extrinsicHash: hash(20),
    strandedAlpha: { netuid: 64, hotkey: hash(21) },
  })

  it("names what each record needs", () => {
    expect(sellAttention(unconfirmedSellRecord({ ...base, extrinsicHash: hash(1) }))).toBe(
      "unconfirmed",
    )
    expect(sellAttention(opened(1, { status: "refunded" }))).toBe("moveRefund")
    expect(sellAttention(stranded)).toBe("returnAlpha")
    expect(sellAttention(opened(1))).toBeNull()
    expect(sellAttention(opened(1, { status: "awaiting-refund" }))).toBeNull()
    expect(sellAttention(opened(1, { status: "filled" }))).toBeNull()
    expect(sellAttention(opened(1, { status: "refunded", refundMove: {} }))).toBeNull()
    expect(sellAttention({ ...stranded, status: "notOpened", strandedAlpha: undefined })).toBeNull()
  })

  it("lists those of accounts still in the wallet", () => {
    const list = [
      opened(1, { status: "refunded" }),
      opened(2, { status: "refunded", address: BOB }),
    ]
    expect(sellsNeedingAttention(list)).toHaveLength(2)
    expect(sellsNeedingAttention(list, (address) => address === ALICE)).toEqual([list[0]])
  })

  it("marks every refunded, unmoved sell of the account moved", () => {
    const list = [
      opened(1, { status: "refunded" }),
      opened(2, { status: "refunded", address: BOB }),
      opened(3, { status: "awaiting-refund" }),
      opened(4, { status: "refunded", refundMove: { to: RECIPIENT } }),
    ]
    const move = { to: RECIPIENT, hash: hash(50), amount: "9.97" }
    const next = markSellRefundsMoved(list, {
      address: ALICE,
      move,
      isSameAddress: (a, b) => a === b,
    })
    expect(next[0].refundMove).toEqual(move)
    expect(next[1]).toBe(list[1])
    expect(next[2]).toBe(list[2])
    expect(next[3]).toBe(list[3])
    expect(
      markSellRefundsMoved(next, { address: ALICE, move, isSameAddress: (a, b) => a === b }),
    ).toBe(next)
  })

  it("marks alpha returned for the account, subnet and hotkey only", () => {
    const other = strandedSellRecord({
      ...base,
      from: { kind: "alpha", netuid: 65, hotkey: HOTKEY },
      extrinsicHash: hash(22),
      strandedAlpha: { netuid: 65, hotkey: hash(21) },
    })
    const list = [stranded, other]
    const next = markStrandedAlphaReturned(list, {
      address: ALICE,
      netuid: 64,
      hotkey: hash(21).toUpperCase().replace("0X", "0x"),
      returned: { hash: hash(60), amount: "12.5" },
      isSameAddress: (a, b) => a === b,
    })
    expect(next[0].strandedAlpha?.returned).toEqual({ hash: hash(60), amount: "12.5" })
    expect(sellAttention(next[0])).toBeNull()
    expect(next[1]).toBe(other)
  })
})

describe("tracking", () => {
  it("follows unfinished orders up to an hour past their fill deadline", () => {
    const list = [
      opened(1, { order: order(1, NOW_S + 100) }),
      opened(2, { status: "awaiting-refund", order: order(2, NOW_S - TRACK_GRACE_SECONDS + 1) }),
      opened(3, { status: "awaiting-refund", order: order(3, NOW_S - TRACK_GRACE_SECONDS) }),
      opened(4, { status: "filled" }),
      unconfirmedSellRecord({ ...base, extrinsicHash: hash(5) }),
    ]
    expect(sellsToTrack(list, { nowSeconds: NOW_S, includeAll: false }).map((r) => r.id)).toEqual([
      opened(1).id,
      opened(2).id,
    ])
  })

  it("follows every unfinished order while Recent swaps is open", () => {
    const list = [
      opened(1, { status: "awaiting-refund", order: order(1, NOW_S - 86_400) }),
      opened(2, { status: "refunded" }),
    ]
    expect(sellsToTrack(list, { nowSeconds: NOW_S, includeAll: true })).toEqual([list[0]])
  })
})

describe("storage", () => {
  it("round-trips a list", () => {
    const list = [
      opened(2, { status: "refunded", refundMove: { to: RECIPIENT, hash: hash(9) } }),
      opened(1, { status: "filled", settledAt: NOW + 5, reported: true }),
    ]
    expect(parseStoredSellRecords(serializeSellRecords(list))).toEqual(list)
  })

  it("reads bad JSON, a non-array or garbage as nothing", () => {
    expect(parseStoredSellRecords("{nope")).toEqual([])
    expect(parseStoredSellRecords({ a: 1 })).toEqual([])
    expect(parseStoredSellRecords([null, 1, "x", {}])).toEqual([])
  })

  it("drops another version's records, and records missing what they need", () => {
    const good = opened(1)
    expect(parseSellRecord({ ...good, version: 2 })).toBeNull()
    expect(parseSellRecord({ ...good, order: undefined })).toBeNull()
    expect(parseSellRecord({ ...good, recipient: "0x123" })).toBeNull()
    expect(parseSellRecord({ ...good, amountIn: "1e9" })).toBeNull()
    expect(parseSellRecord({ ...good, status: "lost" })).toBeNull()
    expect(
      parseSellRecord({ ...good, from: { kind: "alpha", netuid: 0, hotkey: HOTKEY } }),
    ).toBeNull()
    const unconfirmed = unconfirmedSellRecord({ ...base, extrinsicHash: hash(2) })
    expect(parseSellRecord({ ...unconfirmed, extrinsicHash: undefined })).toBeNull()
  })

  it("derives the id again and drops a bad display detail, not the record", () => {
    const good = opened(1)
    expect(parseSellRecord({ ...good, id: "forged", symbol: 42, usdBucket: {} })).toEqual(good)
    expect(parseSellRecord({ ...good, refundMove: { to: "nope", hash: hash(3) } })).toEqual({
      ...good,
      refundMove: { hash: hash(3) },
    })
  })

  it("keeps the newest of duplicates", () => {
    const older = opened(1)
    const newer = { ...older, createdAt: older.createdAt + 10, status: "filled" as const }
    expect(parseStoredSellRecords([older, newer])).toEqual([newer])
  })
})

describe("a late run never undoes another page's progress", () => {
  const sentAt = NOW - 60_000
  const unconfirmed = unconfirmedSellRecord({ ...base, extrinsicHash: hash(7), now: sentAt })
  const fromRun = openedSellRecord({
    ...base,
    amountInRaw: 1_499_999_998n,
    amountOutRaw: 611_000_000n,
    extrinsicHash: hash(7),
    order: order(7),
    now: NOW,
  })

  it("adds a new sell", () => {
    expect(mergeSellRecord([], unconfirmed)).toEqual([unconfirmed])
  })

  it("resolves an unconfirmed send, keeping when it was sent", () => {
    expect(mergeSellRecord([unconfirmed], fromRun)).toEqual([{ ...fromRun, createdAt: sentAt }])
  })

  it("never lets an unconfirmed send replace a resolved or settled record", () => {
    for (const current of [
      { ...unconfirmed, status: "open" as const, order: order(7) },
      { ...unconfirmed, status: "notIncluded" as const },
      {
        ...fromRun,
        status: "filled" as const,
        reported: true,
        settledAt: NOW + 5,
      },
    ]) {
      const list = [current]
      expect(mergeSellRecord(list, unconfirmed)).toBe(list)
    }
  })

  it("adds the run's order and amounts without resetting a later state or the report", () => {
    // "Check again" opened it from the send's expected amounts; a tracker then settled it.
    const settled: CrossChainSellRecord = {
      ...unconfirmed,
      status: "refunded",
      order: order(7),
      settledAt: NOW + 10,
      reported: true,
      refundMove: { to: RECIPIENT },
    }
    const [merged] = mergeSellRecord([settled], fromRun)
    expect(merged).toEqual({
      ...settled,
      amountIn: fromRun.amountIn,
      amountOut: fromRun.amountOut,
    })
  })

  it("takes the run's opened order over a lookup's 'didn't open' or 'not included'", () => {
    for (const status of ["notOpened", "notIncluded"] as const) {
      const [merged] = mergeSellRecord([{ ...unconfirmed, status }], fromRun)
      expect(merged).toMatchObject({ status: "open", order: order(7), createdAt: sentAt })
    }
  })

  it("keeps alpha already returned when the run reports it stranded", () => {
    const alpha = { kind: "alpha", netuid: 64, hotkey: HOTKEY } as const
    const stranded = strandedSellRecord({
      ...base,
      from: alpha,
      extrinsicHash: hash(8),
      strandedAlpha: { netuid: 64, hotkey: hash(21) },
    })
    const returned: CrossChainSellRecord = {
      ...stranded,
      strandedAlpha: { netuid: 64, hotkey: hash(21), returned: { hash: hash(22) } },
    }
    const list = [returned]
    expect(mergeSellRecord(list, stranded)).toBe(list)
  })

  it("forgets a send that moved nothing, but not one another page resolved otherwise", () => {
    expect(discardUnresolvedSell([unconfirmed], unconfirmed.id)).toEqual([])
    expect(
      discardUnresolvedSell([{ ...unconfirmed, status: "notIncluded" }], unconfirmed.id),
    ).toEqual([])
    const opened = [{ ...unconfirmed, status: "open" as const, order: order(7) }]
    expect(discardUnresolvedSell(opened, unconfirmed.id)).toBe(opened)
  })
})

describe("refunds a move covered", () => {
  const isSameAddress = (a: string, b: string) => a === b
  const startedAt = NOW + 1_000

  it("marks only refunds seen landing by the time the balance was read", () => {
    const list = [
      opened(1, { status: "refunded", settledAt: startedAt - 1 }),
      opened(2, { status: "refunded", settledAt: startedAt }),
      opened(3, { status: "refunded", settledAt: startedAt + 1 }),
    ]
    const next = markSellRefundsMoved(list, {
      address: ALICE,
      move: { to: RECIPIENT, hash: hash(50) },
      isSameAddress,
      settledBy: startedAt,
    })
    expect(next.map((record) => record.refundMove !== undefined)).toEqual([true, true, false])
    // The late one still needs the user, until a read finds the address empty.
    expect(sellAttention(next[2])).toBe("moveRefund")
    const emptied = markSellRefundsMoved(next, { address: ALICE, move: {}, isSameAddress })
    expect(sellAttention(emptied[2])).toBeNull()
  })
})

describe("when tracking changes with time", () => {
  it("is the nearest cutoff still ahead of an unfinished order", () => {
    const list = [
      opened(1, { order: order(1, NOW_S + 300) }),
      opened(2, { status: "awaiting-refund", order: order(2, NOW_S - 100) }),
      opened(3, { status: "awaiting-refund", order: order(3, NOW_S - TRACK_GRACE_SECONDS - 5) }),
      opened(4, { status: "filled", order: order(4, NOW_S - 200) }),
    ]
    expect(nextTrackingChange(list, NOW_S)).toBe(NOW_S - 100 + TRACK_GRACE_SECONDS)
    expect(nextTrackingChange(list, NOW_S + 300 + TRACK_GRACE_SECONDS)).toBeUndefined()
    expect(nextTrackingChange([], NOW_S)).toBeUndefined()
  })
})

describe("which page follows what", () => {
  const recent = opened(1, { order: order(1, NOW_S + 300) })
  const old = opened(2, { status: "awaiting-refund", order: order(2, NOW_S - 86_400) })
  const list = [recent, old, opened(3, { status: "filled" })]

  it("the lead page follows the recent orders, and all of them with its Recent swaps open", () => {
    expect(
      trackedSellsFor(list, { nowSeconds: NOW_S, isRecentOpen: false, isLeader: true }),
    ).toEqual([recent])
    expect(
      trackedSellsFor(list, { nowSeconds: NOW_S, isRecentOpen: true, isLeader: true }),
    ).toEqual([recent, old])
  })

  it("another page follows only the older orders its own Recent swaps shows", () => {
    expect(
      trackedSellsFor(list, { nowSeconds: NOW_S, isRecentOpen: false, isLeader: false }),
    ).toEqual([])
    expect(
      trackedSellsFor(list, { nowSeconds: NOW_S, isRecentOpen: true, isLeader: false }),
    ).toEqual([old])
  })
})
