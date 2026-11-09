import {
  DEFAULT_CHAINS,
  EvmCallFailedError,
  InsufficientBalanceError,
  InvalidParamsError,
  SubstrateError,
  substrateEvmAddress,
  SUBTENSOR_EVM,
  UserRejectedError,
} from "@tao.com/intents-sdk"

import { describeCrossChainError } from "../error-codes"
import {
  buildRecoverRefundRequest,
  buildRecoverStakeRequest,
  readRefundAtMirror,
  resolveRecoveryFailure,
} from "../recovery"

const hash = (n: number): `0x${string}` => `0x${n.toString(16).padStart(64, "0")}`
const ALICE = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
const TO = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"

describe("buildRecoverRefundRequest", () => {
  it("moves the refund on Bittensor EVM to a valid address", () => {
    expect(buildRecoverRefundRequest(` ${TO} `)).toEqual({
      ok: true,
      request: { originChainId: 964, to: TO },
    })
  })

  it("refuses what can't receive it, as the sell's recipient check does", () => {
    expect(buildRecoverRefundRequest("")).toEqual({ ok: false, problem: "missing" })
    expect(buildRecoverRefundRequest("0x1234")).toEqual({ ok: false, problem: "tooShort" })
    expect(buildRecoverRefundRequest(TO.replace("d8dA", "D8dA"))).toEqual({
      ok: false,
      problem: "badChecksum",
    })
    expect(buildRecoverRefundRequest(`0x${"0".repeat(40)}`)).toEqual({
      ok: false,
      problem: "zeroAddress",
    })
  })
})

describe("buildRecoverStakeRequest", () => {
  it("returns alpha for the subnet and hotkey the failure named", () => {
    expect(buildRecoverStakeRequest({ netuid: 64, hotkey: hash(7) })).toEqual({
      originChainId: 964,
      netuid: 64,
      hotkey: hash(7),
    })
  })

  it("refuses a subnet or hotkey that can't name a stake", () => {
    expect(buildRecoverStakeRequest({ netuid: 0, hotkey: hash(7) })).toBeNull()
    expect(buildRecoverStakeRequest({ netuid: 1.5, hotkey: hash(7) })).toBeNull()
    expect(buildRecoverStakeRequest({ netuid: 64, hotkey: "0x12" })).toBeNull()
  })
})

describe("readRefundAtMirror", () => {
  it("reads the chain's USDC at the account's EVM address", async () => {
    const readContract = jest.fn(async () => 9_970_000n)
    await expect(readRefundAtMirror({ readContract } as never, ALICE)).resolves.toBe(9_970_000n)
    expect(readContract).toHaveBeenCalledWith(
      expect.objectContaining({
        address: DEFAULT_CHAINS[SUBTENSOR_EVM].usdc,
        functionName: "balanceOf",
        args: [substrateEvmAddress(ALICE)],
      }),
    )
  })
})

describe("resolveRecoveryFailure", () => {
  const resolve = (error: unknown, submittedHash?: `0x${string}`) =>
    resolveRecoveryFailure(describeCrossChainError(error), { submittedHash })

  it("says nothing for a cancel", () => {
    expect(resolve(new UserRejectedError())).toEqual({ kind: "cancelled" })
  })

  it("reads INVALID_PARAMS as nothing left to move", () => {
    expect(resolve(new InvalidParamsError("holds no USDC"))).toEqual({ kind: "nothingLeft" })
  })

  it("never calls a sent batch failed unless the chain rolled it back", () => {
    expect(resolve(new SubstrateError("Couldn't submit", { extrinsicHash: hash(1) }))).toEqual({
      kind: "unconfirmed",
      code: "substrateError",
      txHash: hash(1),
    })
    expect(resolve(new Error("timeout"), hash(2))).toEqual({
      kind: "unconfirmed",
      code: "unknown",
      txHash: hash(2),
    })
    expect(
      resolve(
        new SubstrateError("token.FundsUnavailable", {
          dispatchError: "token.FundsUnavailable",
          extrinsicHash: hash(3),
        }),
        hash(3),
      ),
    ).toEqual({ kind: "error", code: "substrateError" })
  })

  it("lets a reverted transfer be tried again: nothing moved", () => {
    expect(resolve(new EvmCallFailedError("reverted", hash(4)), hash(4))).toEqual({
      kind: "error",
      code: "evmCallFailed",
    })
  })

  it("reads a TAO shortfall as the network fee", () => {
    expect(resolve(new InsufficientBalanceError(10n, 1n, "TAO (for gas)", 9))).toEqual({
      kind: "error",
      code: "insufficientGas",
    })
  })
})
