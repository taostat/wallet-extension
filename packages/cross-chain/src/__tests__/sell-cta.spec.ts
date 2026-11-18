import type { SellCtaInput } from "../sell-cta"
import { quoteErrorCtaLabel, resolveSellCta } from "../sell-cta"

const ready: SellCtaInput = {
  hasAmount: true,
  recipientStatus: "valid",
  shortfall: null,
  quote: { hasQuote: true, isStale: false, isFetching: false, errorCode: undefined },
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
