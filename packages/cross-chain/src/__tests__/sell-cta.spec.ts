import { describe, expect, it } from "vitest"

import type { SellCtaInput } from "../sell-cta"
import { MIN_SELL_USD } from "../sell"
import { isBelowMinimumSell, quoteErrorCtaLabel, resolveSellCta } from "../sell-cta"

const ready: SellCtaInput = {
  hasAmount: true,
  recipientStatus: "valid",
  shortfall: null,
  quote: { hasQuote: true, isStale: false, isFetching: false, errorCode: undefined },
  belowMinimum: false,
}

describe("resolveSellCta", () => {
  it("offers the review when everything is in place", () => {
    expect(resolveSellCta(ready)).toEqual({ kind: "review" })
  })

  it("asks for the amount, then the recipient, first", () => {
    expect(
      resolveSellCta({
        ...ready,
        hasAmount: false,
        recipientStatus: "missing",
        shortfall: "balance",
      }),
    ).toEqual({ kind: "enterAmount" })
    expect(resolveSellCta({ ...ready, recipientStatus: "missing" })).toEqual({
      kind: "recipientMissing",
    })
    expect(resolveSellCta({ ...ready, recipientStatus: "invalid" })).toEqual({
      kind: "recipientInvalid",
    })
  })

  it("then the balance, then the fee", () => {
    expect(resolveSellCta({ ...ready, shortfall: "balance" })).toEqual({
      kind: "insufficientBalance",
    })
    expect(resolveSellCta({ ...ready, shortfall: "fee" })).toEqual({
      kind: "insufficientFeeBalance",
    })
  })

  it("waits for a quote for what is typed now, but not for a background refresh", () => {
    const quote = ready.quote
    expect(
      resolveSellCta({ ...ready, quote: { ...quote, hasQuote: false, isFetching: true } }),
    ).toEqual({
      kind: "quoting",
    })
    expect(
      resolveSellCta({ ...ready, quote: { ...quote, isStale: true, isFetching: true } }),
    ).toEqual({
      kind: "quoting",
    })
    expect(resolveSellCta({ ...ready, quote: { ...quote, isFetching: true } })).toEqual({
      kind: "review",
    })
    expect(resolveSellCta({ ...ready, quote: { ...quote, hasQuote: false } })).toEqual({
      kind: "quoting",
    })
  })

  it("reports a failed quote, but not a silent one", () => {
    const quote = { ...ready.quote, hasQuote: false }
    expect(resolveSellCta({ ...ready, quote: { ...quote, errorCode: "noRoute" } })).toEqual({
      kind: "quoteError",
      code: "noRoute",
    })
    expect(resolveSellCta({ ...ready, quote: { ...quote, errorCode: "aborted" } })).toEqual({
      kind: "quoting",
    })
  })

  it("holds a sell under the minimum back from the review", () => {
    expect(resolveSellCta({ ...ready, belowMinimum: true })).toEqual({ kind: "belowMinimum" })
    // A background refresh of the current quote doesn't change that.
    expect(
      resolveSellCta({
        ...ready,
        belowMinimum: true,
        quote: { ...ready.quote, isFetching: true },
      }),
    ).toEqual({ kind: "belowMinimum" })
  })

  it("checks the minimum last: every other state wins over it", () => {
    const below = { ...ready, belowMinimum: true }
    expect(resolveSellCta({ ...below, hasAmount: false })).toEqual({ kind: "enterAmount" })
    expect(resolveSellCta({ ...below, recipientStatus: "missing" })).toEqual({
      kind: "recipientMissing",
    })
    expect(resolveSellCta({ ...below, recipientStatus: "invalid" })).toEqual({
      kind: "recipientInvalid",
    })
    expect(resolveSellCta({ ...below, shortfall: "balance" })).toEqual({
      kind: "insufficientBalance",
    })
    expect(resolveSellCta({ ...below, shortfall: "fee" })).toEqual({
      kind: "insufficientFeeBalance",
    })
    expect(
      resolveSellCta({ ...below, quote: { ...ready.quote, isStale: true, isFetching: true } }),
    ).toEqual({ kind: "quoting" })
    expect(resolveSellCta({ ...below, quote: { ...ready.quote, hasQuote: false } })).toEqual({
      kind: "quoting",
    })
    expect(
      resolveSellCta({
        ...below,
        quote: { ...ready.quote, hasQuote: false, errorCode: "noRoute" },
      }),
    ).toEqual({ kind: "quoteError", code: "noRoute" })
  })
})

describe("isBelowMinimumSell", () => {
  const current = { hasQuote: true, isStale: false }

  it("is $10", () => {
    expect(MIN_SELL_USD).toBe(10)
  })

  it("holds back a current quote under the minimum, not one at or above it", () => {
    expect(isBelowMinimumSell({ ...current, inputUsd: "2.77" })).toBe(true)
    expect(isBelowMinimumSell({ ...current, inputUsd: "9.99" })).toBe(true)
    expect(isBelowMinimumSell({ ...current, inputUsd: "9.994" })).toBe(true)
    // Shown as "$10.00", so not held back.
    expect(isBelowMinimumSell({ ...current, inputUsd: "9.995" })).toBe(false)
    expect(isBelowMinimumSell({ ...current, inputUsd: "9.999" })).toBe(false)
    expect(isBelowMinimumSell({ ...current, inputUsd: "10" })).toBe(false)
    expect(isBelowMinimumSell({ ...current, inputUsd: "10.00" })).toBe(false)
    expect(isBelowMinimumSell({ ...current, inputUsd: "10.01" })).toBe(false)
    expect(isBelowMinimumSell({ ...current, inputUsd: "390.00" })).toBe(false)
  })

  it("ignores a quote that isn't for what is typed now", () => {
    expect(isBelowMinimumSell({ hasQuote: true, isStale: true, inputUsd: "2.77" })).toBe(false)
    expect(isBelowMinimumSell({ hasQuote: false, isStale: false, inputUsd: "2.77" })).toBe(false)
  })

  it("never blocks a sell the Quoter didn't price", () => {
    for (const inputUsd of [undefined, null, "", "  ", "n/a", "Infinity", "0", "-5"])
      expect(isBelowMinimumSell({ ...current, inputUsd })).toBe(false)
  })
})

describe("quoteErrorCtaLabel", () => {
  it("says what to do about a failed quote", () => {
    expect(quoteErrorCtaLabel("noRoute")).toBe("tryAnotherAmount")
    expect(quoteErrorCtaLabel("swapQuoteFailed")).toBe("tryAnotherAmount")
    expect(quoteErrorCtaLabel("rateLimited")).toBe("rateLimited")
    expect(quoteErrorCtaLabel("paused")).toBe("paused")
    expect(quoteErrorCtaLabel("unreachable")).toBe("noQuote")
  })
})
