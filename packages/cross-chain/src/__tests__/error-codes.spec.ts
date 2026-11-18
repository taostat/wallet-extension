import {
  EvmCallFailedError,
  InsufficientBalanceError,
  OutputBelowMinimumError,
  QuoterError,
  SubstrateError,
} from "@tao.com/intents-sdk"

import {
  CROSS_CHAIN_ERROR_CODES,
  CROSS_CHAIN_ERROR_MESSAGES,
  crossChainErrorMessageKey,
  describeCrossChainError,
  getBalanceShortfall,
  getStrandedAlpha,
  isSilentError,
  toCrossChainErrorCode,
} from "../error-codes"

/** An object shaped like the SDK's `TaoIntentsError` (no class needed). */
const sdkError = (code: string, fields: Record<string, unknown> = {}) =>
  Object.assign(new Error(`SDK ${code}`), { name: "TaoIntentsError", code }, fields)

/** Shaped like the SDK's `QuoterError`. */
const quoterError = (status: number, fields: Record<string, unknown> = {}, code = "QUOTER_ERROR") =>
  sdkError(code, {
    name: "QuoterError",
    status,
    apiError: undefined,
    failures: [],
    retryable: false,
    paused: false,
    blocked: false,
    ...fields,
  })

const HASH = `0x${"ab".repeat(32)}` as const

describe("Quoter errors", () => {
  it("429 is rate limited", () => {
    expect(
      toCrossChainErrorCode(quoterError(429, { apiError: "RATE_LIMITED", retryable: true })),
    ).toBe("rateLimited")
  })

  it("503 SETTLER_PAUSED is paused", () => {
    expect(
      toCrossChainErrorCode(quoterError(503, { apiError: "SETTLER_PAUSED", paused: true })),
    ).toBe("paused")
    expect(toCrossChainErrorCode(quoterError(503, { apiError: "SETTLER_PAUSED" }))).toBe("paused")
  })

  it("403 and no response are unreachable", () => {
    expect(toCrossChainErrorCode(quoterError(403, { blocked: true }, "QUOTER_FORBIDDEN"))).toBe(
      "unreachable",
    )
    expect(
      toCrossChainErrorCode(
        quoterError(0, { blocked: true, retryable: true }, "QUOTER_UNREACHABLE"),
      ),
    ).toBe("unreachable")
  })

  it("a status-0 QUOTER_ERROR (the SDK timeout) and 504 are timeouts", () => {
    expect(toCrossChainErrorCode(quoterError(0, { retryable: true }))).toBe("timeout")
    expect(
      toCrossChainErrorCode(quoterError(504, { apiError: "ALL_SOLVERS_FAILED", retryable: true })),
    ).toBe("timeout")
  })

  it("502 / 422 ALL_SOLVERS_FAILED is no route (try another amount)", () => {
    expect(toCrossChainErrorCode(quoterError(502, { apiError: "ALL_SOLVERS_FAILED" }))).toBe(
      "noRoute",
    )
    expect(toCrossChainErrorCode(quoterError(422, { apiError: "ALL_SOLVERS_FAILED" }))).toBe(
      "noRoute",
    )
  })

  it("400 is invalid params; other 5xx is the service being unavailable", () => {
    expect(toCrossChainErrorCode(quoterError(400))).toBe("invalidParams")
    expect(
      toCrossChainErrorCode(
        quoterError(503, { apiError: "NO_SOLVERS_REGISTERED", retryable: true }),
      ),
    ).toBe("serviceUnavailable")
    expect(toCrossChainErrorCode(quoterError(418))).toBe("unknown")
  })

  it("reads the SDK's own QuoterError the same way", () => {
    const error = new QuoterError({
      status: 429,
      apiError: "RATE_LIMITED",
      message: "slow down",
      retryable: false,
    })
    expect(toCrossChainErrorCode(error)).toBe("rateLimited")
  })
})

describe("SDK error codes", () => {
  it.each([
    ["INVALID_PARAMS", "invalidParams"],
    ["UNSUPPORTED_ROUTE", "unsupportedRoute"],
    ["SWAP_QUOTE_FAILED", "swapQuoteFailed"],
    ["QUOTE_EXPIRED", "quoteExpired"],
    ["INSUFFICIENT_BALANCE", "insufficientBalance"],
    ["INSUFFICIENT_GAS", "insufficientGas"],
    ["USER_REJECTED", "userRejected"],
    ["CONTRACT_REVERT", "contractRevert"],
    ["TRANSACTION_REVERTED", "transactionReverted"],
    ["TRANSACTION_REPLACED", "transactionReplaced"],
    ["WALLET_ERROR", "walletError"],
    ["SUBSTRATE_ERROR", "substrateError"],
    ["EVM_CALL_FAILED", "evmCallFailed"],
    ["OUTPUT_BELOW_MINIMUM", "outputBelowMinimum"],
    ["ORDER_NOT_FOUND", "orderNotFound"],
    ["ABORTED", "aborted"],
    ["TIMEOUT", "timeout"],
    ["INDICATIVE_QUOTE", "unknown"],
  ])("%s → %s", (code, expected) => {
    expect(toCrossChainErrorCode(sdkError(code))).toBe(expected)
  })

  it("reads the SDK's own classes", () => {
    expect(toCrossChainErrorCode(new SubstrateError("no"))).toBe("substrateError")
    expect(toCrossChainErrorCode(new EvmCallFailedError("no"))).toBe("evmCallFailed")
    expect(toCrossChainErrorCode(new OutputBelowMinimumError(1n, 2n))).toBe("outputBelowMinimum")
  })
})

describe("errors from outside the SDK", () => {
  it("a wallet rejection anywhere in the cause chain is userRejected", () => {
    expect(toCrossChainErrorCode({ code: 4001, message: "User denied" })).toBe("userRejected")
    expect(
      toCrossChainErrorCode(
        Object.assign(new Error("wrapped"), {
          cause: { name: "UserRejectedRequestError", message: "no" },
        }),
      ),
    ).toBe("userRejected")
  })

  it("abort and cancellation are aborted", () => {
    expect(toCrossChainErrorCode({ name: "AbortError" })).toBe("aborted")
    expect(toCrossChainErrorCode({ name: "CancelledError" })).toBe("aborted")
  })

  it("anything else is unknown", () => {
    expect(toCrossChainErrorCode(new Error("boom"))).toBe("unknown")
    expect(toCrossChainErrorCode("boom")).toBe("unknown")
    expect(toCrossChainErrorCode(null)).toBe("unknown")
    expect(toCrossChainErrorCode(undefined)).toBe("unknown")
    expect(toCrossChainErrorCode({ code: "SOMETHING_NEW" })).toBe("unknown")
    expect(toCrossChainErrorCode({ code: "toString" })).toBe("unknown")
  })
})

describe("isSilentError", () => {
  it("is true for rejections and aborts only", () => {
    expect(isSilentError(sdkError("USER_REJECTED"))).toBe(true)
    expect(isSilentError(sdkError("ABORTED"))).toBe(true)
    expect(isSilentError(sdkError("QUOTE_EXPIRED"))).toBe(false)
    expect(isSilentError(quoterError(429))).toBe(false)
  })

  it("accepts a code as well", () => {
    expect(isSilentError("userRejected")).toBe(true)
    expect(isSilentError("rateLimited")).toBe(false)
  })
})

describe("details", () => {
  it("reads stranded alpha from an EVM call failure", () => {
    const error = new EvmCallFailedError("reverted", HASH, undefined, { netuid: 64, hotkey: HASH })
    expect(getStrandedAlpha(error)).toEqual({ netuid: 64, hotkey: HASH })
    expect(
      getStrandedAlpha(sdkError("EVM_CALL_FAILED", { strandedAlpha: { netuid: "64" } })),
    ).toBeUndefined()
  })

  it("reads what a balance error needed and found", () => {
    expect(getBalanceShortfall(new InsufficientBalanceError(100n, 5n, "TAO", 9))).toEqual({
      required: 100n,
      available: 5n,
    })
    expect(
      getBalanceShortfall(sdkError("INSUFFICIENT_BALANCE", { required: 1, available: 0 })),
    ).toBeUndefined()
  })

  it("describes an error in one read", () => {
    expect(
      describeCrossChainError(
        new EvmCallFailedError("reverted", HASH, undefined, { netuid: 8, hotkey: HASH }),
      ),
    ).toEqual({
      code: "evmCallFailed",
      silent: false,
      strandedAlpha: { netuid: 8, hotkey: HASH },
      txHash: HASH,
    })
    expect(describeCrossChainError(sdkError("USER_REJECTED"))).toEqual({
      code: "userRejected",
      silent: true,
    })
  })

  it("tells a rolled-back batch from one whose outcome is unknown", () => {
    expect(
      describeCrossChainError(
        new SubstrateError("failed", {
          dispatchError: "balances.InsufficientBalance",
          extrinsicHash: HASH,
        }),
      ),
    ).toEqual({ code: "substrateError", silent: false, txHash: HASH, rolledBack: true })
    expect(
      describeCrossChainError(
        new SubstrateError("not in a block in 90 s", { extrinsicHash: HASH }),
      ),
    ).toEqual({ code: "substrateError", silent: false, txHash: HASH })
  })
})

describe("messages", () => {
  it("has an English message, the i18n key, for every code", () => {
    for (const code of CROSS_CHAIN_ERROR_CODES) {
      expect(CROSS_CHAIN_ERROR_MESSAGES[code]).toMatch(/^[A-Z].+\.$/)
      expect(crossChainErrorMessageKey(code)).toBe(CROSS_CHAIN_ERROR_MESSAGES[code])
    }
    expect(Object.keys(CROSS_CHAIN_ERROR_MESSAGES).sort()).toEqual(
      [...CROSS_CHAIN_ERROR_CODES].sort(),
    )
  })

  it("says what happened for the errors a sell meets", () => {
    expect(crossChainErrorMessageKey("rateLimited")).toBe(
      "Too many price requests. Wait a moment and try again.",
    )
    expect(crossChainErrorMessageKey("evmCallFailed")).toBe(
      "Your Bittensor transaction went through, but the swap couldn't be opened.",
    )
    expect(crossChainErrorMessageKey("substrateError")).toBe(
      "The Bittensor transaction failed. Try again.",
    )
  })

  it("never names the provider", () => {
    for (const message of Object.values(CROSS_CHAIN_ERROR_MESSAGES))
      expect(message.toLowerCase()).not.toContain("tao.com")
  })
})
