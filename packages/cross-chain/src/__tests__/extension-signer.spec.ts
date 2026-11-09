import type { SubstrateEvent, SubstrateSignOptions } from "@tao.com/intents-sdk"
import { Binary } from "@polkadot-api/substrate-bindings"
import { InvalidParamsError, SubstrateError } from "@tao.com/intents-sdk"

import type { ExtensionSignerApi, ExtensionSignerSapi } from "../extension-signer"
import type { SubmitAndWatchResult } from "../substrate-signer"
import { BATCH_METHOD, BATCH_PALLET, toSapiCalls } from "../calls"
import {
  createExtensionSubstrateSigner,
  readSpendableAfterFee,
  spendableAfterFee,
} from "../extension-signer"
import { createTestSapi } from "./chain"
import { ALICE, taoSellBatch } from "./sdk-calls"

const SIGNATURE = `0x01${"5a".repeat(64)}` as const
const EXTRINSIC_HASH = `0x${"e1".repeat(32)}` as const
const BLOCK_HASH = `0x${"b1".repeat(32)}` as const
const ED = 500n

const success: SubstrateEvent = { section: "system", method: "ExtrinsicSuccess", data: [{}] }

/** What sapi's `getExtrinsicPayload` returns, cut down: the signer payload and the rest. */
type SignerPayload = { address: string; method: string }
type Payload = { payload: SignerPayload; txMetadata: undefined; shortMetadata: undefined }
type TxInfo = { type: "test"; label: string }

/** Binary values compared by their bytes (each instance carries its own accessor functions). */
const plain = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map(plain)
    : value && typeof value === "object"
      ? "asHex" in value
        ? (value as { asHex: () => string }).asHex()
        : Object.fromEntries(Object.entries(value).map(([k, v]) => [k, plain(v)]))
      : value

const rejection = async (promise: Promise<unknown>) => {
  try {
    await promise
  } catch (error) {
    return error as Error & Record<string, unknown>
  }
  throw new Error("expected a rejection")
}

const setup = ({
  account = { data: { free: 10_000n, frozen: 0n } } as unknown,
  fee = 1_000n,
  txInfo,
  checkSpendable,
}: {
  account?: unknown
  fee?: bigint
  txInfo?: TxInfo
  checkSpendable?: boolean
} = {}) => {
  const log: string[] = []
  const signerPayload: SignerPayload = { address: ALICE, method: "0x1234" }

  const sapi = {
    getExtrinsicPayload: jest.fn(async (): Promise<Payload> => {
      log.push("build")
      return { payload: signerPayload, txMetadata: undefined, shortMetadata: undefined }
    }),
    getFeeEstimate: jest.fn(async () => fee),
    getStorage: jest.fn(async () => account),
    getConstant: jest.fn(() => ED),
  }
  const api = {
    subSign: jest.fn(async () => {
      log.push("subSign")
      return { signature: SIGNATURE, extrinsicHash: EXTRINSIC_HASH }
    }),
    subSubmitAndWatch: jest.fn(async (): Promise<SubmitAndWatchResult> => {
      log.push("subSubmitAndWatch")
      return { blockHash: BLOCK_HASH, events: [success], ok: true }
    }),
  }
  const options: SubstrateSignOptions = {
    onSigned: (hash) => log.push(`onSigned ${hash}`),
    beforeSubmit: () => {
      log.push("beforeSubmit")
    },
  }

  const signer = createExtensionSubstrateSigner({
    address: ALICE,
    sapi: sapi as unknown as ExtensionSignerSapi<Payload>,
    api: api as unknown as ExtensionSignerApi<SignerPayload, TxInfo>,
    txInfo,
    checkSpendable,
  })
  return { api, log, options, sapi, signer, signerPayload }
}

describe("createExtensionSubstrateSigner: signAndSendBatch", () => {
  it("builds with sapi, signs, lets the SDK veto, reports the hash, then submits", async () => {
    const { api, log, options, sapi, signer, signerPayload } = setup()
    const calls = taoSellBatch()

    const result = await signer.signAndSendBatch(calls, options)

    expect(log).toEqual([
      "build",
      "subSign",
      "beforeSubmit",
      `onSigned ${EXTRINSIC_HASH}`,
      "subSubmitAndWatch",
    ])
    expect(result).toEqual({
      extrinsicHash: EXTRINSIC_HASH,
      blockHash: BLOCK_HASH,
      events: [success],
    })

    // the payload is sapi's Utility.batch_all of the mapped calls, for the signing coldkey
    expect(plain(sapi.getExtrinsicPayload.mock.calls)).toEqual([
      [BATCH_PALLET, BATCH_METHOD, { calls: plain(toSapiCalls(calls)) }, { address: ALICE }],
    ])
    // the service worker gets the signer payload itself, not sapi's wrapper around it
    expect(api.subSign).toHaveBeenCalledWith(signerPayload)
    expect((api.subSign.mock.calls[0] as unknown[])[0]).toBe(signerPayload)
    expect(api.subSubmitAndWatch).toHaveBeenCalledWith(signerPayload, SIGNATURE, undefined)
    expect((api.subSubmitAndWatch.mock.calls[0] as unknown[])[0]).toBe(signerPayload)
  })

  it("passes txInfo to subSubmitAndWatch, for the History entry", async () => {
    const txInfo: TxInfo = { type: "test", label: "batch" }
    const { api, signer, signerPayload } = setup({ txInfo })
    await signer.signAndSendBatch(taoSellBatch())
    expect(api.subSubmitAndWatch).toHaveBeenCalledWith(signerPayload, SIGNATURE, txInfo)
  })

  it("submits nothing when the SDK vetoes after signing", async () => {
    const { api, log, signer } = setup()
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
    expect(log).toEqual(["build", "subSign"])
    expect(onSigned).not.toHaveBeenCalled()
    expect(api.subSubmitAndWatch).not.toHaveBeenCalled()
  })

  it("turns a refused signature (e.g. not a keypair account) into SubstrateError, submitting nothing", async () => {
    const { api, signer } = setup()
    api.subSign.mockRejectedValueOnce(
      new Error("Can't sign: only an account whose key is in this wallet (keypair) can sign here"),
    )
    const error = await rejection(signer.signAndSendBatch(taoSellBatch()))
    expect(error).toBeInstanceOf(SubstrateError)
    expect(error.message).toMatch(/^Couldn't sign the batch: Can't sign: only an account/)
    expect(api.subSubmitAndWatch).not.toHaveBeenCalled()
  })

  it("reports the service worker's dispatch error with the extrinsic hash", async () => {
    const { api, signer } = setup()
    api.subSubmitAndWatch.mockResolvedValueOnce({
      blockHash: BLOCK_HASH,
      events: [{ section: "system", method: "ExtrinsicFailed", data: [{}, {}] }],
      ok: false,
      error: "token.FundsUnavailable",
    })
    const error = await rejection(signer.signAndSendBatch(taoSellBatch()))
    expect(error).toBeInstanceOf(SubstrateError)
    expect(error).toMatchObject({
      dispatchError: "token.FundsUnavailable",
      extrinsicHash: EXTRINSIC_HASH,
    })
  })
})

describe("createExtensionSubstrateSigner: spendableAfterFee", () => {
  it("is free − max(frozen, ED) − the batch's fee, read with sapi", async () => {
    const { sapi, signer, signerPayload } = setup({
      account: { data: { free: 10_000n, frozen: 2_000n } },
      fee: 1_000n,
    })
    await expect(signer.spendableAfterFee!(taoSellBatch())).resolves.toBe(7_000n)
    expect(sapi.getStorage).toHaveBeenCalledWith("System", "Account", [ALICE])
    expect(sapi.getConstant).toHaveBeenCalledWith("Balances", "ExistentialDeposit")
    expect(sapi.getFeeEstimate).toHaveBeenCalledWith(signerPayload)
  })

  it("keeps the existential deposit when less is frozen, and never goes below 0", async () => {
    const withLittleFrozen = setup({ account: { data: { free: 10_000n, frozen: 100n } } })
    await expect(withLittleFrozen.signer.spendableAfterFee!(taoSellBatch())).resolves.toBe(8_500n)

    const tooPoor = setup({ account: { data: { free: 1_200n, frozen: 0n } }, fee: 1_000n })
    await expect(tooPoor.signer.spendableAfterFee!(taoSellBatch())).resolves.toBe(0n)

    const notStored = setup({ account: null })
    await expect(notStored.signer.spendableAfterFee!(taoSellBatch())).resolves.toBe(0n)
  })

  it("rejects when a value can't be read, so the SDK skips its check", async () => {
    const { signer } = setup({ account: { data: { free: "10000", frozen: 0n } } })
    await expect(signer.spendableAfterFee!(taoSellBatch())).rejects.toThrow(
      /can't read the free balance/,
    )
  })

  it("is absent with checkSpendable: false", () => {
    expect(setup({ checkSpendable: false }).signer.spendableAfterFee).toBeUndefined()
  })

  it("reads System.Account and the existential deposit the way sapi decodes them", async () => {
    const sapi = createTestSapi([
      [
        "System",
        "Account",
        [ALICE],
        {
          nonce: 7,
          consumers: 0,
          providers: 1,
          sufficients: 0,
          data: { free: 5_000_000_000n, reserved: 0n, frozen: 1_000_000n, flags: 0n },
        },
      ],
    ])
    expect(sapi.getConstant("Balances", "ExistentialDeposit")).toBe(ED)

    const payload = await sapi.getExtrinsicPayload(
      "System",
      "remark",
      { remark: Binary.fromHex("0x") },
      { address: ALICE },
    )
    // the fee estimate is a runtime call: stand it in
    const getFeeEstimate = jest.fn(async () => 2_000_000n)
    await expect(readSpendableAfterFee({ ...sapi, getFeeEstimate }, ALICE, payload)).resolves.toBe(
      5_000_000_000n - 1_000_000n - 2_000_000n,
    )
    expect(getFeeEstimate).toHaveBeenCalledWith(payload.payload)
  })
})

describe("spendableAfterFee", () => {
  it.each([
    [{ free: 10n, frozen: 0n, existentialDeposit: 2n, fee: 3n }, 5n],
    [{ free: 10n, frozen: 4n, existentialDeposit: 2n, fee: 3n }, 3n],
    [{ free: 10n, frozen: 4n, existentialDeposit: 2n, fee: 7n }, 0n],
    [{ free: 0n, frozen: 0n, existentialDeposit: 500n, fee: 0n }, 0n],
  ])("%o → %s", (input, expected) => {
    expect(spendableAfterFee(input)).toBe(expected)
  })
})
