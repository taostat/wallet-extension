import {
  AbortedError,
  EvmCallFailedError,
  InsufficientBalanceError,
  OutputBelowMinimumError,
  QuoteExpiredError,
  SubstrateError,
  TimeoutError,
  UserRejectedError,
} from "@tao.com/intents-sdk"

import { describeCrossChainError } from "../error-codes"
import { executionStopFor, isReportedFailure, resolveSellFailure } from "../execute-outcome"

const hash = (n: number): `0x${string}` => `0x${n.toString(16).padStart(64, "0")}`
const NOW = 1_793_000_000_000

const outcome = (error: unknown, submittedHash?: `0x${string}`) =>
  resolveSellFailure(describeCrossChainError(error), { submittedHash, now: NOW })

describe("resolveSellFailure: nothing sent", () => {
  it("goes back to the review quietly on our own abort", () => {
    expect(outcome(new AbortedError())).toEqual({ kind: "review", feedback: {} })
    expect(outcome(new UserRejectedError())).toEqual({ kind: "review", feedback: {} })
  })

  it("asks for a new price when it moved past the floor", () => {
    expect(outcome(new OutputBelowMinimumError(1n, 2n))).toEqual({
      kind: "review",
      feedback: { priceMovedAt: NOW },
    })
  })

  it("says what was needed for a short balance", () => {
    expect(outcome(new InsufficientBalanceError(10n, 4n, "TAO", 9))).toEqual({
      kind: "review",
      feedback: {
        error: { code: "insufficientBalance", shortfall: { required: 10n, available: 4n } },
      },
    })
  })

  it("lets a signing failure before broadcast be retried", () => {
    expect(outcome(new SubstrateError("Couldn't sign the batch"))).toEqual({
      kind: "review",
      feedback: { error: { code: "substrateError" } },
    })
    expect(outcome(new QuoteExpiredError())).toEqual({
      kind: "review",
      feedback: { error: { code: "quoteExpired" } },
    })
  })
})

describe("resolveSellFailure: sent", () => {
  it("lets a batch that failed on chain, and so rolled back, be retried", () => {
    expect(
      outcome(
        new SubstrateError("balances.InsufficientBalance", {
          dispatchError: "balances.InsufficientBalance",
          extrinsicHash: hash(5),
        }),
        hash(5),
      ),
    ).toEqual({ kind: "review", feedback: { error: { code: "substrateError" } } })
  })

  it("keeps the alpha's whereabouts after a batch whose open reverted", () => {
    const stranded = { netuid: 64, hotkey: hash(3) }
    const result = outcome(
      new EvmCallFailedError("reverted", hash(4), undefined, stranded),
      hash(4),
    )
    expect(result).toEqual({
      kind: "failed",
      code: "evmCallFailed",
      strandedAlpha: stranded,
      txHash: hash(4),
    })
    expect(executionStopFor(result)).toBe("notOpened")
  })

  it("lets a batch the SDK reports as EVM_CALL_FAILED be retried when the signer saw it roll back", () => {
    // The SDK turns a sweep that can't clear (token.FundsUnavailable / balances.InsufficientBalance)
    // into EvmCallFailedError: the batch was rolled back and nothing moved.
    const details = describeCrossChainError(new EvmCallFailedError("rolled back", hash(6)))
    const result = resolveSellFailure(details, {
      submittedHash: hash(6),
      now: NOW,
      batchRolledBack: true,
    })
    expect(result).toEqual({ kind: "review", feedback: { error: { code: "substrateError" } } })
    expect(
      resolveSellFailure(
        describeCrossChainError(
          new EvmCallFailedError("rolled back", hash(6), undefined, {
            netuid: 64,
            hotkey: hash(3),
          }),
        ),
        { submittedHash: hash(6), now: NOW, batchRolledBack: true },
      ),
    ).toEqual({ kind: "review", feedback: { error: { code: "substrateError" } } })
  })

  it("for TAO, a reverted open strands nothing", () => {
    expect(outcome(new EvmCallFailedError("reverted", hash(4)), hash(4))).toEqual({
      kind: "failed",
      code: "evmCallFailed",
      txHash: hash(4),
    })
  })

  it("calls a submit that failed, or a batch not seen in a block in time, unconfirmed", () => {
    // The service worker's 90 s watch, or a dropped connection after broadcast.
    const result = outcome(
      new SubstrateError("Couldn't submit the batch: not in a block within 90 s", {
        extrinsicHash: hash(7),
      }),
      hash(7),
    )
    expect(result).toEqual({ kind: "unconfirmed", code: "substrateError", txHash: hash(7) })
    expect(executionStopFor(result)).toBe("unconfirmed")
  })

  it("takes the hash from the error when onSigned's never arrived", () => {
    expect(outcome(new SubstrateError("lost", { extrinsicHash: hash(8) }))).toEqual({
      kind: "unconfirmed",
      code: "substrateError",
      txHash: hash(8),
    })
  })

  it("never offers a retry when a sent batch's outcome is unknown, whatever the error", () => {
    expect(outcome(new TimeoutError("slow"), hash(6))).toEqual({
      kind: "unconfirmed",
      code: "timeout",
      txHash: hash(6),
    })
    expect(outcome(new Error("anything"), hash(6))).toEqual({
      kind: "unconfirmed",
      code: "unknown",
      txHash: hash(6),
    })
  })
})

describe("isReportedFailure", () => {
  it("is not the user's own cancel", () => {
    expect(isReportedFailure(describeCrossChainError(new AbortedError()))).toBe(false)
    expect(isReportedFailure(describeCrossChainError(new QuoteExpiredError()))).toBe(true)
  })
})
