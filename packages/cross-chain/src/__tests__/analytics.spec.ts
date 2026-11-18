import {
  entryOpenedEvent,
  recoveryFinishedEvent,
  recoveryStartedEvent,
  reviewOpenedEvent,
  sellAnalyticsContext,
  swapFailedEvent,
  swapSettledEvent,
  swapSubmittedEvent,
  usdBucket,
} from "../analytics"

describe("usdBucket", () => {
  it("buckets a USD value as the website does", () => {
    expect(usdBucket(undefined)).toBeUndefined()
    expect(usdBucket(Number.NaN)).toBeUndefined()
    expect(usdBucket(-1)).toBeUndefined()
    expect(usdBucket(0)).toBe("<100")
    expect(usdBucket(99.99)).toBe("<100")
    expect(usdBucket(100)).toBe("100-1k")
    expect(usdBucket(9_999)).toBe("1k-10k")
    expect(usdBucket(10_000)).toBe("10k+")
  })
})

describe("events", () => {
  const tao = { from: "tao", to: "USDC", usdBucket: "100-1k" } as const
  const alpha = { from: "alpha", to: "ETH" } as const

  it("names the website's events, with coarse data and the wallet as source", () => {
    expect(entryOpenedEvent()).toEqual({
      name: "cross_chain_entry_opened",
      data: { source: "extension", direction: "sell" },
    })
    expect(reviewOpenedEvent(tao)).toEqual({
      name: "cross_chain_review_opened",
      data: {
        route: "bt:tao→eth:usdc",
        from: "tao",
        to: "usdc",
        source: "extension",
        usd: "100-1k",
      },
    })
    expect(swapSubmittedEvent(alpha)).toEqual({
      name: "cross_chain_swap_submitted",
      data: { route: "bt:alpha→eth:eth", from: "alpha", to: "eth", source: "extension" },
    })
    expect(swapSettledEvent(alpha, "refunded").data.state).toBe("refunded")
    expect(swapFailedEvent(tao, "substrateError").data.code).toBe("substrateError")
  })

  it("leaves out a bucket it doesn't know", () => {
    expect(reviewOpenedEvent({ ...tao, usdBucket: "1M+" }).data.usd).toBeUndefined()
  })

  it("never carries an address, a hash, a netuid or an amount", () => {
    const record = {
      from: {
        kind: "alpha",
        netuid: 64,
        hotkey: "5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy",
      },
      to: "USDC",
      usdBucket: "<100",
    } as const
    const event = swapSettledEvent(sellAnalyticsContext(record), "filled")
    const text = JSON.stringify(event)
    expect(text).not.toMatch(/5DAA|64|0x/)
    expect(Object.keys(event.data).sort()).toEqual([
      "from",
      "route",
      "source",
      "state",
      "to",
      "usd",
    ])
  })

  it("describes recoveries by kind and result, with the code only for a failure", () => {
    expect(recoveryStartedEvent("refund")).toEqual({
      name: "cross_chain_recovery_started",
      data: { kind: "refund", source: "extension" },
    })
    expect(recoveryFinishedEvent("alpha", "moved", "unknown")).toEqual({
      name: "cross_chain_recovery_finished",
      data: { kind: "alpha", result: "moved", source: "extension" },
    })
    expect(recoveryFinishedEvent("refund", "failed", "insufficientGas").data.code).toBe(
      "insufficientGas",
    )
  })
})
