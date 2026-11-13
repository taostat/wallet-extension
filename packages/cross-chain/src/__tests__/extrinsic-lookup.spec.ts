import { Blake2256 } from "@polkadot-api/substrate-bindings"
import {
  DEFAULT_CHAINS,
  intentsAbi,
  parseSubstrateAddress,
  SUBTENSOR_EVM,
} from "@tao.com/intents-sdk"
import {
  bytesToHex,
  encodeAbiParameters,
  encodeEventTopics,
  getAbiItem,
  hexToBytes,
  keccak256,
  pad,
} from "viem"

import type { SellEvmLog } from "../extrinsic-lookup"
import {
  BITTENSOR_INTENTS_CONTRACTS,
  extrinsicEventsFromRecords,
  extrinsicSearchRange,
  extrinsicSearchVerdict,
  findExtrinsicIndex,
  hasExtrinsicOutcome,
  openedOrderFromLogs,
  sellExtrinsicOutcome,
} from "../extrinsic-lookup"

type Hex = `0x${string}`

const hash = (n: number): Hex => `0x${n.toString(16).padStart(64, "0")}`
const SETTLER = DEFAULT_CHAINS[SUBTENSOR_EVM].intents
const HOTKEY = "5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy"
const ORDER_ID = hash(0xabc)
const FILL_DEADLINE = 1_793_000_300

/** TAO.com's Intents contracts on Subtensor EVM: the first ones (16AE), and 9737 since 2026-11-12. */
const BITTENSOR_16AE = "0x24834012973b6e70997a23C7aAB01481d46CB8E1"
const BITTENSOR_9737 = "0x2D3f088b124364C0002748dB5D0A30e82512efea"
/** The 9737 contract on Ethereum: it never opens a sell's order. */
const ETHEREUM_9737 = "0x1252456515616DE1cFF3bc0a15CCF3b85Bf9294B"

/**
 * A real order on the 9737 contracts: a coldkey's sell of 0.1 TAO for 20.984131 USDC on
 * 2026-11-13, opened in extrinsic 9497739-0006 on the 9737 Bittensor contract and filled on Ethereum
 * in 0x15e8108e67fe9b9059218607e5847680b6c5fff31b7b04176a859592f0bb7522. `REAL_9737_ORIGIN_DATA` is
 * that fill log's data, which is the order's `originData` in the 9737 layout (one word longer than
 * 16AE's: it ends with `refundTo`); its keccak256 is the order id. The `Open` log itself isn't
 * recorded here: `real9737OpenLog` rebuilds it around the order's own user, fill deadline,
 * destination and `originData`, with stand-ins for what the lookup doesn't read.
 */
const REAL_9737_ORDER_ID = "0x9b49ac02890107c0305d583ee9f5594c3427c86502a845a96b13359f9ad6824c"
const REAL_9737_FILL_DEADLINE = 1_794_576_887 // 2026-11-13 13:34:47 UTC
const REAL_9737_ORIGIN_DATA: Hex = `0x${[
  "0000000000000000000000000000000000000000000000000000000000000020",
  "0000000000000000000000007ce42e2921a72569791b4b0f16696af1b3ef4789", // user
  "000000000000000000000000000000000000000000000000000000006af711f7", // fillDeadline
  "0000000000000000000000009001dbe4d68d36ab87923a2a9dfb0c745fd25001", // inputToken (USDC, Bittensor)
  "000000000000000000000000000000000000000000000000000000000142e23c", // inputAmount
  "000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", // outputToken (USDC, Ethereum)
  "0000000000000000000000000000000000000000000000000000000001403143", // outputAmount
  "00000000000000000000000000000000000000000000000000000000000003c4", // originChainId (964)
  "0000000000000000000000000000000000000000000000000000000000000001", // destinationChainId
  "000000000000000000000000c50a19cbda7ec7b18b34682d4d7eb110aeb30d96", // recipient
  "0000000000000000000000001252456515616de1cff3bc0a15ccf3b85bf9294b", // destinationSettler
  "00000000000000000000000000000000000000000000000000000000000001a0", // subtensorData (offset)
  "0000000000000000000000000000000000000000000000000000000000000006", // nonce
  "0000000000000000000000007ce42e2921a72569791b4b0f16696af1b3ef4789", // refundTo (9737 only)
  "0000000000000000000000000000000000000000000000000000000000000000", // subtensorData: empty
].join("")}`

type OpenLogOrder = {
  orderId?: Hex
  fillDeadline?: number
  user?: Hex
  destinationSettler?: Hex
  originData?: Hex
}

/** An `Open` log as an Intents contract emits it (the event is the same on every contract). */
const openLog = (
  address: string = SETTLER,
  destinationChainId = 1n,
  {
    orderId = ORDER_ID,
    fillDeadline = FILL_DEADLINE,
    user = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
    destinationSettler = hash(1),
    originData = "0x",
  }: OpenLogOrder = {},
): SellEvmLog => {
  const event = getAbiItem({ abi: intentsAbi, name: "Open" })
  const topics = encodeEventTopics({
    abi: intentsAbi,
    eventName: "Open",
    args: { orderId },
  })
  const data = encodeAbiParameters(
    [event.inputs[1]],
    [
      {
        user,
        originChainId: 964n,
        openDeadline: 0,
        fillDeadline,
        orderId,
        maxSpent: [],
        minReceived: [],
        fillInstructions: [{ destinationChainId, destinationSettler, originData }],
      },
    ],
  )
  return { address: address as Hex, topics: topics as Hex[], data }
}

/** The real 9737 order's `Open`, emitted by the 9737 Bittensor contract (lower case, as polkadot-js gives it). */
const real9737OpenLog = () =>
  openLog(BITTENSOR_9737.toLowerCase(), 1n, {
    orderId: REAL_9737_ORDER_ID,
    fillDeadline: REAL_9737_FILL_DEADLINE,
    user: "0x7ce42e2921a72569791b4b0f16696af1b3ef4789",
    destinationSettler: pad(ETHEREUM_9737.toLowerCase() as Hex),
    originData: REAL_9737_ORIGIN_DATA,
  })

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

  it("knows every Bittensor Intents contract of the SDK, the old one and the new", () => {
    expect(SETTLER).toBe(BITTENSOR_9737)
    expect(BITTENSOR_INTENTS_CONTRACTS).toEqual(
      expect.arrayContaining([BITTENSOR_16AE, BITTENSOR_9737]),
    )
    expect(BITTENSOR_INTENTS_CONTRACTS).not.toContain(ETHEREUM_9737)
  })

  it.each([
    ["the 9737 contract", BITTENSOR_9737],
    ["the 16AE contract (sells sent before 2026-11-12)", BITTENSOR_16AE],
    ["the 9737 contract, in lower case", BITTENSOR_9737.toLowerCase()],
  ])("reads an Open log from %s", (_name, address) => {
    expect(openedOrderFromLogs([openLog(address)])).toEqual({
      orderId: ORDER_ID,
      originChainId: 964,
      destinationChainId: 1,
      fillDeadline: FILL_DEADLINE,
    })
  })

  it("reads a real 9737 order, whose originData ends with refundTo", () => {
    expect(keccak256(REAL_9737_ORIGIN_DATA)).toBe(REAL_9737_ORDER_ID)
    expect(openedOrderFromLogs([real9737OpenLog()])).toEqual({
      orderId: REAL_9737_ORDER_ID,
      originChainId: 964,
      destinationChainId: 1,
      fillDeadline: REAL_9737_FILL_DEADLINE,
    })
  })

  it("ignores an Open log from another contract, and other logs", () => {
    expect(openedOrderFromLogs([openLog("0x0000000000000000000000000000000000000001")])).toBeNull()
    // The Ethereum contracts never open a sell's order.
    expect(openedOrderFromLogs([openLog(ETHEREUM_9737)])).toBeNull()
    expect(openedOrderFromLogs([{ address: SETTLER, topics: [hash(5)], data: "0x" }])).toBeNull()
  })

  it("reads only the contracts it is given", () => {
    expect(openedOrderFromLogs([openLog(BITTENSOR_16AE)], [BITTENSOR_9737])).toBeNull()
    expect(openedOrderFromLogs([openLog(BITTENSOR_16AE)], [BITTENSOR_16AE])).toMatchObject({
      orderId: ORDER_ID,
    })
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

  it("finds a real 9737 order in the block's events, as sapi decodes them", () => {
    const records = [
      record(5, "EVM", "Log", {}),
      evmLog(6, real9737OpenLog()),
      record(6, "System", "ExtrinsicSuccess"),
    ]
    expect(sellExtrinsicOutcome(extrinsicEventsFromRecords(records, 6), tao)).toEqual({
      kind: "opened",
      order: {
        orderId: REAL_9737_ORDER_ID,
        originChainId: 964,
        destinationChainId: 1,
        fillDeadline: REAL_9737_FILL_DEADLINE,
      },
    })
  })

  it("finds an order a sell sent before 2026-11-12 opened on the 16AE contract", () => {
    expect(sellExtrinsicOutcome(events({ logs: [openLog(BITTENSOR_16AE)] }), alpha)).toMatchObject({
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
