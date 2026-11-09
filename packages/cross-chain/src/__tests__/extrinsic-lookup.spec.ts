import { Blake2256 } from "@polkadot-api/substrate-bindings"
import {
  DEFAULT_CHAINS,
  intentsAbi,
  parseSubstrateAddress,
  SUBTENSOR_EVM,
} from "@tao.com/intents-sdk"
import { bytesToHex, encodeAbiParameters, encodeEventTopics, getAbiItem, hexToBytes } from "viem"

import type { SellEvmLog } from "../extrinsic-lookup"
import {
  extrinsicEventsFromRecords,
  extrinsicSearchRange,
  extrinsicSearchVerdict,
  findExtrinsicIndex,
  hasExtrinsicOutcome,
  openedOrderFromLogs,
  sellExtrinsicOutcome,
} from "../extrinsic-lookup"

const hash = (n: number): `0x${string}` => `0x${n.toString(16).padStart(64, "0")}`
const SETTLER = DEFAULT_CHAINS[SUBTENSOR_EVM].intents
const HOTKEY = "5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy"
const ORDER_ID = hash(0xabc)
const FILL_DEADLINE = 1_793_000_300

/** An `Open` log as the Intents contract emits it. */
const openLog = (address: string = SETTLER, destinationChainId = 1n): SellEvmLog => {
  const event = getAbiItem({ abi: intentsAbi, name: "Open" })
  const topics = encodeEventTopics({
    abi: intentsAbi,
    eventName: "Open",
    args: { orderId: ORDER_ID },
  })
  const data = encodeAbiParameters(
    [event.inputs[1]],
    [
      {
        user: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
        originChainId: 964n,
        openDeadline: 0,
        fillDeadline: FILL_DEADLINE,
        orderId: ORDER_ID,
        maxSpent: [],
        minReceived: [],
        fillInstructions: [{ destinationChainId, destinationSettler: hash(1), originData: "0x" }],
      },
    ],
  )
  return { address: address as `0x${string}`, topics: topics as `0x${string}`[], data }
}

/** A `Binary` as sapi decodes it. */
const binary = (hex: string) => ({ asHex: () => hex })

const record = (index: number, pallet: string, event: string, value: unknown = {}) => ({
  phase: { type: "ApplyExtrinsic", value: index },
  event: { type: pallet, value: { type: event, value } },
  topics: [],
})

const evmLog = (index: number, log: SellEvmLog) =>
  record(index, "EVM", "Log", {
    log: { address: binary(log.address), topics: log.topics.map(binary), data: binary(log.data) },
  })

describe("extrinsicSearchRange", () => {
  it("looks only in the block History saw it in, when it did", () => {
    expect(extrinsicSearchRange({ birthBlock: 100, includedBlock: 103, headBlock: 500 })).toEqual({
      from: 103,
      to: 103,
      isComplete: true,
      isHistoryBlock: true,
    })
  })

  it("looks in the blocks its era allows, up to the head", () => {
    expect(extrinsicSearchRange({ birthBlock: 100, headBlock: 110 })).toEqual({
      from: 100,
      to: 110,
      isComplete: false,
      isHistoryBlock: false,
    })
    expect(extrinsicSearchRange({ birthBlock: 100, headBlock: 1_000 })).toEqual({
      from: 100,
      to: 164,
      isComplete: true,
      isHistoryBlock: false,
    })
  })
})

describe("extrinsicSearchVerdict", () => {
  const era = (headBlock: number) => extrinsicSearchRange({ birthBlock: 100, headBlock })
  const absent = { kind: "absent" } as const
  const unreadable = { kind: "unreadable" } as const
  const found = { kind: "found", blockHash: hash(9), extrinsicIndex: 3 } as const
  const reads = (count: number, at?: { index: number; result: unknown }) =>
    Array.from({ length: count }, (_, i) => (at && i === at.index ? at.result : absent)) as never[]

  it("finds it in a block that was read", () => {
    expect(extrinsicSearchVerdict(era(1_000), [absent, absent, found])).toEqual(found)
    // Found wins even if another block couldn't be read.
    expect(extrinsicSearchVerdict(era(1_000), [unreadable, found])).toEqual(found)
  })

  it("proves it was never included only once every block of its era was read and lacks it", () => {
    expect(extrinsicSearchVerdict(era(1_000), reads(65))).toEqual({ kind: "notIncluded" })
  })

  it("says it may still land when the era isn't over and every block so far lacks it", () => {
    expect(extrinsicSearchVerdict(era(110), reads(11))).toEqual({ kind: "pending" })
  })

  it("proves nothing when a block couldn't be read, or wasn't read at all", () => {
    expect(
      extrinsicSearchVerdict(era(1_000), reads(65, { index: 40, result: unreadable })),
    ).toEqual({ kind: "unknown" })
    expect(extrinsicSearchVerdict(era(110), reads(11, { index: 0, result: unreadable }))).toEqual({
      kind: "unknown",
    })
    expect(extrinsicSearchVerdict(era(1_000), reads(64))).toEqual({ kind: "unknown" })
  })

  it("proves nothing when the block History saw it in doesn't have it", () => {
    const range = extrinsicSearchRange({ birthBlock: 100, includedBlock: 103, headBlock: 1_000 })
    expect(extrinsicSearchVerdict(range, [absent])).toEqual({ kind: "unknown" })
    expect(extrinsicSearchVerdict(range, [found])).toEqual(found)
  })
})

describe("findExtrinsicIndex", () => {
  it("finds an extrinsic by the blake2-256 of its bytes, any case", () => {
    const extrinsics = ["0x0102", "0x0a0b0c", "0xff"]
    const wanted = bytesToHex(Blake2256(hexToBytes("0x0a0b0c")))
      .toUpperCase()
      .replace("0X", "0x")
    expect(findExtrinsicIndex(extrinsics, wanted)).toBe(1)
    expect(findExtrinsicIndex(extrinsics, hash(1))).toBe(-1)
  })
})

describe("extrinsicEventsFromRecords", () => {
  it("keeps the extrinsic's own events, reading sapi's binaries", () => {
    const log = openLog()
    const events = extrinsicEventsFromRecords(
      [
        record(1, "EVM", "ExecutedFailed"),
        evmLog(1, openLog()),
        record(2, "System", "ExtrinsicSuccess"),
        evmLog(2, log),
        { phase: { type: "Finalization" }, event: record(2, "System", "ExtrinsicFailed").event },
      ],
      2,
    )
    expect(events).toEqual({ succeeded: true, failed: false, evmFailed: false, logs: [log] })
  })

  it("sees a failed extrinsic and a reverted EVM call", () => {
    expect(
      extrinsicEventsFromRecords(
        [record(0, "System", "ExtrinsicFailed"), record(0, "EVM", "ExecutedFailed")],
        0,
      ),
    ).toEqual({ succeeded: false, failed: true, evmFailed: true, logs: [] })
  })

  it("skips what it can't read", () => {
    expect(extrinsicEventsFromRecords("nope", 0)).toEqual({
      succeeded: false,
      failed: false,
      evmFailed: false,
      logs: [],
    })
    expect(
      extrinsicEventsFromRecords([null, record(0, "EVM", "Log", { log: { address: 5 } })], 0).logs,
    ).toEqual([])
  })
})

describe("openedOrderFromLogs", () => {
  it("reads the order from the Intents contract's Open log, as the SDK does", () => {
    expect(openedOrderFromLogs([openLog()])).toEqual({
      orderId: ORDER_ID,
      originChainId: 964,
      destinationChainId: 1,
      fillDeadline: FILL_DEADLINE,
    })
  })

  it("ignores an Open log from another contract, and other logs", () => {
    expect(openedOrderFromLogs([openLog("0x0000000000000000000000000000000000000001")])).toBeNull()
    expect(openedOrderFromLogs([{ address: SETTLER, topics: [hash(5)], data: "0x" }])).toBeNull()
  })
})

describe("sellExtrinsicOutcome", () => {
  const tao = { kind: "tao" } as const
  const alpha = { kind: "alpha", netuid: 64, hotkey: HOTKEY } as const
  // A batch that went through, unless the case says otherwise.
  const events = (overrides = {}) => ({
    succeeded: true,
    failed: false,
    evmFailed: false,
    logs: [],
    ...overrides,
  })

  it("finds the order the batch opened", () => {
    expect(sellExtrinsicOutcome(events({ logs: [openLog()] }), tao)).toMatchObject({
      kind: "opened",
      order: { orderId: ORDER_ID },
    })
  })

  it("says nothing moved when the batch failed on chain", () => {
    expect(
      sellExtrinsicOutcome(events({ succeeded: false, failed: true, logs: [openLog()] }), alpha),
    ).toEqual({ kind: "notIncluded" })
  })

  it("can't tell anything when the extrinsic's events weren't read", () => {
    // Pruned state, or `System.Events` read as nothing: no success, no failure, no log.
    expect(sellExtrinsicOutcome(events({ succeeded: false }), alpha)).toBeNull()
    expect(sellExtrinsicOutcome(extrinsicEventsFromRecords(null, 2), tao)).toBeNull()
    // Other extrinsics' events only.
    expect(
      sellExtrinsicOutcome(
        extrinsicEventsFromRecords([record(1, "System", "ExtrinsicSuccess")], 2),
        tao,
      ),
    ).toBeNull()
    expect(hasExtrinsicOutcome(extrinsicEventsFromRecords(null, 2))).toBe(false)
  })

  it("says the swap didn't open, and where alpha was left", () => {
    expect(sellExtrinsicOutcome(events({ evmFailed: true }), tao)).toEqual({ kind: "notOpened" })
    expect(sellExtrinsicOutcome(events(), alpha)).toEqual({
      kind: "notOpened",
      strandedAlpha: { netuid: 64, hotkey: parseSubstrateAddress(HOTKEY)?.accountId },
    })
  })
})
