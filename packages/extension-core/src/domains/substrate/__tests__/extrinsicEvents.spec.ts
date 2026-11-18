import type { DispatchError } from "@polkadot/types/interfaces"

import type { TestEvent, TestEventRecord } from "../../../../tests/bittensor"
import {
  ALICE,
  createBittensorRegistry,
  decodeEvents,
  dispatchErrors,
  encodeEvents,
  events,
} from "../../../../tests/bittensor"
import { describeDispatchError, getExtrinsicOutcome } from "../extrinsicEvents"

const SETTLER = "0x5c1d1d6e8b9b7a3e0d4c2f6a8b0e3d5c7a9f1b2D" as const
const OPEN_TOPIC = `0x${"a1".repeat(32)}` as const
const ORDER_ID = `0x${"0d".repeat(32)}` as const
const SOURCE = "0xD43593c715Fdd31c61141ABd04a99FD6822c8558" as const

const { registry } = createBittensorRegistry()

/** Encode records as the chain stores them, decode them as the service worker does. */
const records = (list: TestEventRecord[]) => decodeEvents(registry, encodeEvents(list))

/** The batch is extrinsic 1; extrinsic 0 (an inherent) and 2 are someone else's. */
const block = (batch: TestEvent[]) =>
  records([
    { phase: "Initialization", event: events.withdraw(ALICE, 1n) },
    { phase: 0, event: events.success() },
    ...batch.map((event) => ({ phase: 1, event })),
    { phase: 2, event: events.withdraw(ALICE, 99n) },
    { phase: 2, event: events.failed(dispatchErrors.other("BadOrigin")) },
    { phase: "Finalization", event: events.withdraw(ALICE, 2n) },
  ])

describe("getExtrinsicOutcome", () => {
  it("keeps only this extrinsic's events, in order, with polkadot-js names and toJSON data", () => {
    const outcome = getExtrinsicOutcome(
      registry,
      block([
        events.withdraw(ALICE, 1_000n),
        events.evmLog(SETTLER, [OPEN_TOPIC, ORDER_ID], "0xDEADbeef"),
        events.success(),
      ]),
      1,
    )

    expect(outcome.ok).toBe(true)
    expect(outcome.error).toBeUndefined()
    expect(outcome.events.map((e) => `${e.section}.${e.method}`)).toEqual([
      "balances.Withdraw",
      "evm.Log",
      "system.ExtrinsicSuccess",
    ])
    expect(outcome.events[0]).toEqual({
      section: "balances",
      method: "Withdraw",
      data: [ALICE, 1000],
    })
    // the log the swap SDK reads: lower-case 0x hex, topics as 32-byte hex, data as hex
    expect(outcome.events[1]).toEqual({
      section: "evm",
      method: "Log",
      data: [
        { address: SETTLER.toLowerCase(), topics: [OPEN_TOPIC, ORDER_ID], data: "0xdeadbeef" },
      ],
    })
    expect(outcome.events[2]).toMatchObject({ section: "system", method: "ExtrinsicSuccess" })
    expect(JSON.parse(JSON.stringify(outcome))).toEqual(outcome) // survives the port as is
  })

  it("leaves out Initialization / Finalization records and other extrinsics' events", () => {
    const decoded = block([events.success()])
    expect(decoded.length).toBe(6)
    expect(getExtrinsicOutcome(registry, decoded, 1).events).toEqual([
      expect.objectContaining({ section: "system", method: "ExtrinsicSuccess" }),
    ])
    // extrinsic 2 failed, but the batch (1) didn't
    expect(getExtrinsicOutcome(registry, decoded, 1).ok).toBe(true)
    expect(getExtrinsicOutcome(registry, decoded, 2)).toMatchObject({
      ok: false,
      error: "BadOrigin",
    })
    expect(getExtrinsicOutcome(registry, decoded, 3)).toEqual({ events: [], ok: true })
  })

  it("keeps a reverted EVM call as evm.ExecutedFailed in a batch that succeeded", () => {
    const outcome = getExtrinsicOutcome(
      registry,
      block([events.evmExecutedFailed(SOURCE), events.success()]),
      1,
    )
    expect(outcome).toEqual({
      events: [
        { section: "evm", method: "ExecutedFailed", data: [SOURCE.toLowerCase()] },
        expect.objectContaining({ section: "system", method: "ExtrinsicSuccess" }),
      ],
      ok: true,
    })
  })

  it("fails with <section>.<Error> for a module error (balances.InsufficientBalance)", () => {
    const outcome = getExtrinsicOutcome(
      registry,
      block([
        events.withdraw(ALICE, 1_000n),
        events.failedInModule(registry, "Balances", "InsufficientBalance"),
      ]),
      1,
    )
    expect(outcome.ok).toBe(false)
    expect(outcome.error).toMatch(/^balances\.InsufficientBalance(: .+)?$/)
    // as polkadot-js (and the swap SDK's own polkadotSigner) write it: the docs follow
    expect(outcome.error).toBe("balances.InsufficientBalance: Balance too low to send value.")
    expect(outcome.events.map((e) => `${e.section}.${e.method}`)).toEqual([
      "balances.Withdraw",
      "system.ExtrinsicFailed",
    ])
  })

  it("fails with token.<Variant> for a token error (token.FundsUnavailable)", () => {
    const outcome = getExtrinsicOutcome(
      registry,
      block([events.failed(dispatchErrors.token("FundsUnavailable"))]),
      1,
    )
    expect(outcome).toMatchObject({ ok: false, error: "token.FundsUnavailable" })
    expect(outcome.events).toEqual([
      expect.objectContaining({ section: "system", method: "ExtrinsicFailed" }),
    ])
  })

  it("names arithmetic errors arithmetic.<Variant> and other variants by their name", () => {
    const arithmetic = getExtrinsicOutcome(
      registry,
      block([events.failed(dispatchErrors.arithmetic("Overflow"))]),
      1,
    )
    expect(arithmetic.error).toBe("arithmetic.Overflow")
    const badOrigin = getExtrinsicOutcome(
      registry,
      block([events.failed(dispatchErrors.other("BadOrigin"))]),
      1,
    )
    expect(badOrigin.error).toBe("BadOrigin")
  })
})

describe("describeDispatchError", () => {
  it("writes a module error the metadata doesn't know as Module and its JSON", () => {
    const unknown = registry.createType<DispatchError>("SpRuntimeDispatchError", {
      Module: { index: 250, error: "0x02000000" },
    })
    expect(describeDispatchError(registry, unknown)).toBe(
      'Module: {"index":250,"error":"0x02000000"}',
    )
  })
})
