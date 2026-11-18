import type { GenericEvent } from "@polkadot/types"
import type { SubstrateEvent, SubstrateSignOptions } from "@tao.com/intents-sdk"
import { Binary, FixedSizeBinary } from "@polkadot-api/substrate-bindings"
import {
  intentsAbi,
  InvalidParamsError,
  SubstrateError,
  TaoIntentsError,
  UserRejectedError,
} from "@tao.com/intents-sdk"
import { getAbiItem, toEventSelector } from "viem"

import type { SapiCall } from "../calls"
import type { SapiSubstrateSignerDeps, SubmitAndWatchResult } from "../substrate-signer"
import { toSapiCalls } from "../calls"
import { eventsProblem } from "../events"
import { createSapiSubstrateSigner } from "../substrate-signer"
import { createPolkadotJs, createTestSapi } from "./chain"
import { ALICE, SETTLER, SOURCE, taoSellBatch } from "./sdk-calls"

const SIGNATURE = `0x01${"5a".repeat(64)}` as const
const EXTRINSIC_HASH = `0x${"e1".repeat(32)}` as const
const BLOCK_HASH = `0x${"b1".repeat(32)}` as const
const ORDER_ID = `0x${"0d".repeat(32)}` as const
const OPEN_TOPIC = toEventSelector(getAbiItem({ abi: intentsAbi, name: "Open" }))

const openLog: SubstrateEvent = {
  section: "evm",
  method: "Log",
  data: [{ address: SETTLER.toLowerCase(), topics: [OPEN_TOPIC, ORDER_ID], data: "0x" }],
}
const success: SubstrateEvent = {
  section: "system",
  method: "ExtrinsicSuccess",
  data: [{ weight: { refTime: 1, proofSize: 2 }, class: "Normal", paysFee: "Yes" }],
}
const okResult = (events: SubstrateEvent[] = [openLog, success]): SubmitAndWatchResult => ({
  blockHash: BLOCK_HASH,
  events,
  ok: true,
})

type Payload = { calls: SapiCall[] }

const setup = (overrides: Partial<SapiSubstrateSignerDeps<Payload>> = {}) => {
  const log: string[] = []
  const deps: SapiSubstrateSignerDeps<Payload> = {
    address: ALICE,
    buildBatchPayload: jest.fn(async (calls: SapiCall[]) => {
      log.push("build")
      return { calls }
    }),
    sign: jest.fn(async () => {
      log.push("sign")
      return { signature: SIGNATURE, extrinsicHash: EXTRINSIC_HASH }
    }),
    submitAndWatch: jest.fn(async () => {
      log.push("submit")
      return okResult()
    }),
    ...overrides,
  }
  const options: SubstrateSignOptions = {
    onSigned: (hash) => log.push(`onSigned ${hash}`),
    beforeSubmit: () => {
      log.push("beforeSubmit")
    },
  }
  return { deps, log, options, signer: createSapiSubstrateSigner(deps) }
}

/** Binary values compared by their bytes (each instance carries its own accessor functions). */
const plain = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map(plain)
    : value && typeof value === "object"
      ? "asHex" in value
        ? (value as { asHex: () => string }).asHex()
        : Object.fromEntries(Object.entries(value).map(([k, v]) => [k, plain(v)]))
      : value

const firstArgs = (fn: unknown) => plain((fn as jest.Mock).mock.calls[0])

const rejection = async (promise: Promise<unknown>) => {
  try {
    await promise
  } catch (error) {
    return error as Error & Record<string, unknown>
  }
  throw new Error("expected a rejection")
}

describe("createSapiSubstrateSigner: signAndSendBatch", () => {
  it("builds, signs, lets the SDK veto, reports the hash, submits, in that order", async () => {
    const { deps, log, options, signer } = setup()
    const calls = taoSellBatch()

    const result = await signer.signAndSendBatch(calls, options)

    expect(log).toEqual(["build", "sign", "beforeSubmit", `onSigned ${EXTRINSIC_HASH}`, "submit"])
    const mapped = plain(toSapiCalls(calls))
    expect(firstArgs(deps.buildBatchPayload)).toEqual([mapped])
    expect(firstArgs(deps.sign)).toEqual([{ calls: mapped }])
    expect(firstArgs(deps.submitAndWatch)).toEqual([{ calls: mapped }, SIGNATURE])
    expect(result).toEqual({
      extrinsicHash: EXTRINSIC_HASH,
      blockHash: BLOCK_HASH,
      events: [openLog, success],
    })
  })

  it("gives onSigned the hash before anything is submitted", async () => {
    const { deps, signer } = setup()
    const onSigned = jest.fn(() => expect(deps.submitAndWatch).not.toHaveBeenCalled())
    await signer.signAndSendBatch(taoSellBatch(), { onSigned })
    expect(onSigned).toHaveBeenCalledWith(EXTRINSIC_HASH)
    expect(onSigned).toHaveBeenCalledTimes(1)
  })

  it("submits nothing when beforeSubmit throws, and doesn't report it as submitted", async () => {
    const { deps, log, signer } = setup()
    const veto = new InvalidParamsError("Signing took too long")
    const onSigned = jest.fn()

    const error = await rejection(
      signer.signAndSendBatch(taoSellBatch(), {
        onSigned,
        beforeSubmit: () => {
          throw veto
        },
      }),
    )

    expect(error).toBe(veto)
    expect(deps.submitAndWatch).not.toHaveBeenCalled()
    expect(onSigned).not.toHaveBeenCalled()
    expect(log).toEqual(["build", "sign"])
  })

  it("works without options", async () => {
    const { signer } = setup()
    await expect(signer.signAndSendBatch(taoSellBatch())).resolves.toMatchObject({
      extrinsicHash: EXTRINSIC_HASH,
    })
  })

  it("refuses a call it can't map before building or signing anything", async () => {
    const { deps, signer } = setup()
    const error = await rejection(
      signer.signAndSendBatch([
        { section: "balances", method: "transferAll", args: [ALICE, false] },
      ]),
    )
    expect(error).toBeInstanceOf(SubstrateError)
    expect(error.message).toMatch(/unsupported call `balances.transferAll`/)
    expect(deps.buildBatchPayload).not.toHaveBeenCalled()
    expect(deps.sign).not.toHaveBeenCalled()
  })

  it("turns any signing failure into SubstrateError: a local keypair never asks the user, so it is never a rejection", async () => {
    for (const message of ["Can't sign: Unauthorised", "Cancelled", "User rejected the request"]) {
      const { deps, signer } = setup({
        sign: jest.fn(async () => Promise.reject(new Error(message))),
      })
      const error = await rejection(signer.signAndSendBatch(taoSellBatch()))
      expect(error).toBeInstanceOf(SubstrateError)
      expect(error).not.toBeInstanceOf(UserRejectedError)
      expect(error.message).toBe(`Couldn't sign the batch: ${message}`)
      expect(error.cause).toBeInstanceOf(Error)
      expect(error.extrinsicHash).toBeUndefined()
      expect(deps.submitAndWatch).not.toHaveBeenCalled()
    }
  })

  it("lets an SDK error thrown while signing through unchanged", async () => {
    for (const thrown of [new UserRejectedError(), new InvalidParamsError("bad")]) {
      const { deps, signer } = setup({ sign: jest.fn(async () => Promise.reject(thrown)) })
      const error = await rejection(signer.signAndSendBatch(taoSellBatch()))
      expect(error).toBe(thrown)
      expect(error).toBeInstanceOf(TaoIntentsError)
      expect(deps.submitAndWatch).not.toHaveBeenCalled()
    }
  })

  it("rejects with the hash when the batch can't be submitted (dropped, invalid, network)", async () => {
    const { signer } = setup({
      submitAndWatch: jest.fn(async () => Promise.reject(new Error("The extrinsic was dropped"))),
    })
    const error = await rejection(signer.signAndSendBatch(taoSellBatch()))
    expect(error).toBeInstanceOf(SubstrateError)
    expect(error.message).toBe("Couldn't submit the batch: The extrinsic was dropped")
    expect(error.extrinsicHash).toBe(EXTRINSIC_HASH)
  })

  it("rejects with the dispatch error when the extrinsic failed on chain", async () => {
    const { signer } = setup({
      submitAndWatch: jest.fn(async () => ({
        ...okResult([{ section: "system", method: "ExtrinsicFailed", data: [{}, {}] }]),
        ok: false,
        error: "balances.InsufficientBalance",
      })),
    })
    const error = await rejection(signer.signAndSendBatch(taoSellBatch()))
    expect(error).toBeInstanceOf(SubstrateError)
    expect(error.message).toBe("balances.InsufficientBalance")
    expect(error.dispatchError).toBe("balances.InsufficientBalance")
    expect(error.extrinsicHash).toBe(EXTRINSIC_HASH)
  })

  it("treats system.ExtrinsicFailed as a failure even if ok says otherwise", async () => {
    const { signer } = setup({
      submitAndWatch: jest.fn(async () =>
        okResult([{ section: "system", method: "ExtrinsicFailed", data: [{}, {}] }]),
      ),
    })
    const error = await rejection(signer.signAndSendBatch(taoSellBatch()))
    expect(error).toBeInstanceOf(SubstrateError)
    expect(error.message).toBe("The batch failed on chain.")
    expect(error.dispatchError).toBeUndefined()
  })

  it("resolves when an EVM call reverted inside a successful batch: the SDK reads that from the events", async () => {
    const failed = { section: "evm", method: "ExecutedFailed", data: [SOURCE.toLowerCase()] }
    const { signer } = setup({ submitAndWatch: jest.fn(async () => okResult([failed, success])) })
    await expect(signer.signAndSendBatch(taoSellBatch())).resolves.toMatchObject({
      events: [failed, success],
    })
  })

  it("refuses events that break the contract instead of letting the SDK misread them", async () => {
    const papiStyle = { section: "EVM", method: "Log", data: openLog.data }
    const { signer } = setup({
      submitAndWatch: jest.fn(async () => okResult([papiStyle, success])),
    })
    const error = await rejection(signer.signAndSendBatch(taoSellBatch()))
    expect(error).toBeInstanceOf(SubstrateError)
    expect(error.message).toMatch(/is in block 0xb1.*lower camel case/)
    expect(error.extrinsicHash).toBe(EXTRINSIC_HASH)
  })
})

describe("createSapiSubstrateSigner: spendableAfterFee", () => {
  it("is absent when the wallet can't tell, so the SDK skips the check", () => {
    expect(setup().signer.spendableAfterFee).toBeUndefined()
  })

  it("asks the wallet with the payload of the mapped batch", async () => {
    const getSpendableAfterFee = jest.fn(async () => 123n)
    const { deps, signer } = setup({ getSpendableAfterFee })
    const calls = taoSellBatch()

    await expect(signer.spendableAfterFee!(calls)).resolves.toBe(123n)
    expect(firstArgs(deps.buildBatchPayload)).toEqual([plain(toSapiCalls(calls))])
    expect(firstArgs(getSpendableAfterFee)).toEqual([{ calls: plain(toSapiCalls(calls)) }])
    expect(deps.sign).not.toHaveBeenCalled()
  })
})

describe("createSapiSubstrateSigner: address", () => {
  it("exposes the coldkey and refuses something that isn't one", () => {
    expect(setup().signer.address).toBe(ALICE)
    expect(() => setup({ address: SOURCE })).toThrow(SubstrateError)
    expect(() => setup({ address: `${ALICE.slice(0, -1)}Z` })).toThrow()
  })
})

describe("event normalisation contract", () => {
  const sapi = createTestSapi()
  const { registry } = createPolkadotJs()

  /** An event as the chain stores it, decoded with polkadot-js and mapped as events.ts says. */
  const viaPolkadotJs = (pallet: string, name: string, value: unknown): SubstrateEvent => {
    const { location, codec } = sapi.chain.builder.buildEvent(pallet, name)
    const bytes = new Uint8Array([...location, ...codec.enc(value)])
    const event = registry.createType<GenericEvent>("Event", bytes)
    return {
      section: event.section,
      method: event.method,
      data: event.data.map((d) => d.toJSON()),
    }
  }

  it("gives an evm.Log the { address, topics, data } the SDK reads, in lower-case hex", () => {
    const event = viaPolkadotJs("EVM", "Log", {
      log: {
        address: FixedSizeBinary.fromHex(SETTLER),
        topics: [FixedSizeBinary.fromHex(OPEN_TOPIC), FixedSizeBinary.fromHex(ORDER_ID)],
        data: Binary.fromHex("0xdeadbeef"),
      },
    })
    expect(event).toEqual({
      section: "evm",
      method: "Log",
      data: [
        { address: SETTLER.toLowerCase(), topics: [OPEN_TOPIC, ORDER_ID], data: "0xdeadbeef" },
      ],
    })
    expect(eventsProblem([event])).toBeNull()
  })

  it("names evm.ExecutedFailed and system.ExtrinsicFailed the way the SDK and signer look for them", () => {
    const failed = viaPolkadotJs("EVM", "ExecutedFailed", {
      address: FixedSizeBinary.fromHex(SOURCE),
    })
    expect(failed).toEqual({
      section: "evm",
      method: "ExecutedFailed",
      data: [SOURCE.toLowerCase()],
    })

    const extrinsicFailed = viaPolkadotJs("System", "ExtrinsicFailed", {
      dispatch_error: { type: "BadOrigin", value: undefined },
      dispatch_info: {
        weight: { ref_time: 1n, proof_size: 2n },
        class: { type: "Normal", value: undefined },
        pays_fee: { type: "Yes", value: undefined },
      },
    })
    expect(extrinsicFailed.section).toBe("system")
    expect(extrinsicFailed.method).toBe("ExtrinsicFailed")
    expect(eventsProblem([failed, extrinsicFailed])).toBeNull()
  })

  it("says what is wrong with an event that breaks it", () => {
    expect(eventsProblem("nope")).toMatch(/not an array/)
    expect(eventsProblem([null])).toMatch(/not an object/)
    expect(eventsProblem([{ section: "System", method: "ExtrinsicSuccess", data: [] }])).toMatch(
      /lower camel case/,
    )
    expect(eventsProblem([{ section: "evm", method: "log", data: [] }])).toMatch(/variant name/)
    expect(eventsProblem([{ section: "evm", method: "Log" }])).toMatch(/no data array/)
    expect(
      eventsProblem([
        {
          section: "evm",
          method: "Log",
          data: [{ address: SETTLER, topics: ["0x01"], data: "0x" }],
        },
      ]),
    ).toMatch(/evm.Log/)
    expect(eventsProblem([openLog, success])).toBeNull()
  })
})
