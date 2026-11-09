import {
  isAwaitingMovedPrice,
  refundEstimate,
  resolveReviewCta,
  reviewPrice,
} from "../review-price"

describe("reviewPrice", () => {
  const accepted = 1_000_000n

  it("takes the floor from the accepted output while nothing newer is known", () => {
    expect(
      reviewPrice({ acceptedOutput: accepted, latestOutput: undefined, slippageBps: 100 }),
    ).toEqual({ baseOutput: accepted, minOutput: 990_000n, hasMoved: false })
  })

  it("raises the floor silently for a better price", () => {
    expect(
      reviewPrice({ acceptedOutput: accepted, latestOutput: 1_100_000n, slippageBps: 100 }),
    ).toEqual({ baseOutput: 1_100_000n, minOutput: 1_089_000n, hasMoved: false })
  })

  it("keeps the accepted floor for a worse price within slippage", () => {
    expect(
      reviewPrice({ acceptedOutput: accepted, latestOutput: 990_000n, slippageBps: 100 }),
    ).toEqual({ baseOutput: accepted, minOutput: 990_000n, hasMoved: false })
  })

  it("asks once the price falls below the floor", () => {
    expect(
      reviewPrice({ acceptedOutput: accepted, latestOutput: 989_999n, slippageBps: 100 }).hasMoved,
    ).toBe(true)
  })
})

describe("isAwaitingMovedPrice", () => {
  it("waits for a quote newer than the failure", () => {
    expect(isAwaitingMovedPrice(undefined, 0)).toBe(false)
    expect(isAwaitingMovedPrice(1_000, 900)).toBe(true)
    expect(isAwaitingMovedPrice(1_000, 1_000)).toBe(true)
    expect(isAwaitingMovedPrice(1_000, 1_001)).toBe(false)
  })
})

describe("refundEstimate", () => {
  it("prices TAO or alpha at its USD value, less the protocol fee", () => {
    expect(refundEstimate({ inputUsd: "1000", protocolFeeBps: 30 })).toEqual({
      kind: "approx",
      usdc: 997,
    })
    expect(refundEstimate({ inputUsd: "1234.56", protocolFeeBps: 0 })).toEqual({
      kind: "approx",
      usdc: 1234.56,
    })
  })

  it("keeps the USD value when the fee is unknown or not a fee", () => {
    expect(refundEstimate({ inputUsd: "9", protocolFeeBps: undefined })).toEqual({
      kind: "approx",
      usdc: 9,
    })
    expect(refundEstimate({ inputUsd: "9", protocolFeeBps: 1.5 })).toEqual({
      kind: "approx",
      usdc: 9,
    })
  })

  it("says nothing when nothing prices it", () => {
    expect(refundEstimate({ inputUsd: undefined })).toEqual({ kind: "unknown" })
    expect(refundEstimate({ inputUsd: "0" })).toEqual({ kind: "unknown" })
  })
})

describe("resolveReviewCta", () => {
  const ready = {
    signerReady: true,
    hasQuote: true,
    quoteFailed: false,
    awaitingMovedPrice: false,
    hasMoved: false,
  }

  it("confirms when everything is in place", () => {
    expect(resolveReviewCta(ready)).toEqual({ kind: "confirm" })
  })

  it("asks to accept a moved price", () => {
    expect(resolveReviewCta({ ...ready, hasMoved: true })).toEqual({ kind: "acceptPrice" })
  })

  it("waits for the firm quote, and for the new price after a move", () => {
    expect(resolveReviewCta({ ...ready, hasQuote: false })).toEqual({ kind: "gettingPrice" })
    expect(resolveReviewCta({ ...ready, awaitingMovedPrice: true, hasMoved: true })).toEqual({
      kind: "gettingPrice",
    })
  })

  it("puts the signer first, then a failed quote", () => {
    expect(resolveReviewCta({ ...ready, signerReady: false, quoteFailed: true })).toEqual({
      kind: "walletNotReady",
    })
    expect(resolveReviewCta({ ...ready, quoteFailed: true, hasMoved: true })).toEqual({
      kind: "quoteError",
    })
  })
})
