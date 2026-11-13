import type { QuoteSummaryInput } from "../quote-summary"
import {
  etaDisplay,
  minimumReceivedRaw,
  parseUsd,
  quoteCosts,
  quoteEtaSeconds,
  quoteRate,
  sellQuoteSummary,
} from "../quote-summary"

/** 1 TAO (rao) → 386.5 USDC, shaped like the SDK's `Quote`. */
const taoToUsdc = (overrides: Partial<QuoteSummaryInput> = {}): QuoteSummaryInput => ({
  inputAmount: 1_000_000_000n,
  inputToken: { decimals: 9 },
  outputAmount: 386_500_000n,
  inputUsd: "390.00",
  outputUsd: "386.50",
  fees: {
    sellUsd: "390.00",
    totalUsd: "3.50",
    serviceUsd: "1.17",
    solverUsd: "1.83",
    fillGasUsd: "0.50",
    poolSlippageBps: 12,
  },
  protocolFeeBps: 30,
  raw: { eta: 95 },
  ...overrides,
})

describe("parseUsd", () => {
  it("reads the Quoter's USD strings", () => {
    expect(parseUsd("12.5")).toBe(12.5)
    expect(parseUsd("0")).toBe(0)
    expect(parseUsd("")).toBeUndefined()
    expect(parseUsd(undefined)).toBeUndefined()
    expect(parseUsd(null)).toBeUndefined()
    expect(parseUsd("n/a")).toBeUndefined()
  })
})

describe("quoteRate", () => {
  it("gives the output per unit of input", () => {
    expect(quoteRate(taoToUsdc(), 6)).toBeCloseTo(386.5, 10)
    expect(quoteRate(taoToUsdc({ inputAmount: 0n }), 6)).toBeUndefined()
  })
})

describe("quoteCosts", () => {
  it("reads the total as what is paid less what is received, with the split", () => {
    const costs = quoteCosts(taoToUsdc())
    expect(costs.totalUsd).toBeCloseTo(3.5, 10)
    expect(costs.breakdown).toEqual({
      serviceUsd: 1.17,
      solverUsd: 1.83,
      networkGasUsd: 0.5,
      priceImpactBps: 12,
    })
  })

  it("hides a split that does not describe the swap (alpha input)", () => {
    const costs = quoteCosts(
      taoToUsdc({
        inputUsd: "25.00",
        outputUsd: "24.60",
        fees: { sellUsd: "0.000002", totalUsd: "0" },
      }),
    )
    expect(costs.totalUsd).toBeCloseTo(0.4, 10)
    expect(costs.breakdown).toBeUndefined()
  })

  it("trusts a split within 5% of the input value", () => {
    expect(quoteCosts(taoToUsdc({ fees: { sellUsd: "371.00" } })).breakdown).toBeDefined()
    expect(quoteCosts(taoToUsdc({ fees: { sellUsd: "370.00" } })).breakdown).toBeUndefined()
  })

  it("never shows a negative cost, and none without both USD values", () => {
    expect(quoteCosts(taoToUsdc({ outputUsd: "400" })).totalUsd).toBe(0)
    expect(quoteCosts(taoToUsdc({ outputUsd: undefined })).totalUsd).toBeUndefined()
  })
})

describe("ETA", () => {
  it("reads raw.eta in seconds", () => {
    expect(quoteEtaSeconds({ eta: 95 })).toBe(95)
    expect(quoteEtaSeconds({ eta: "120" })).toBe(120)
    expect(quoteEtaSeconds({ eta: 0 })).toBeUndefined()
    expect(quoteEtaSeconds({})).toBeUndefined()
    expect(quoteEtaSeconds(null)).toBeUndefined()
  })

  it("says seconds under a minute, else whole minutes rounded up", () => {
    expect(etaDisplay(0.4)).toEqual({ unit: "seconds", count: 1 })
    expect(etaDisplay(45)).toEqual({ unit: "seconds", count: 45 })
    expect(etaDisplay(60)).toEqual({ unit: "minutes", count: 1 })
    expect(etaDisplay(95)).toEqual({ unit: "minutes", count: 2 })
  })
})

describe("minimumReceivedRaw", () => {
  it("takes the slippage off the quoted output", () => {
    expect(minimumReceivedRaw({ outputAmount: 10_000n }, 100)).toBe(9_900n)
    expect(minimumReceivedRaw({ outputAmount: 999n }, 50)).toBe(994n)
  })
})

describe("sellQuoteSummary", () => {
  it("gives what is received, the least that may arrive and the fees", () => {
    const summary = sellQuoteSummary(taoToUsdc(), 100)
    expect(summary).toMatchObject({
      receiveRaw: 386_500_000n,
      minReceiveRaw: 382_635_000n,
      inputUsd: 390,
      outputUsd: 386.5,
      protocolFeeBps: 30,
      etaSeconds: 95,
    })
    expect(summary.costs.totalUsd).toBeCloseTo(3.5, 10)
  })

  it("drops a protocol fee that isn't whole bps", () => {
    expect(
      sellQuoteSummary(taoToUsdc({ protocolFeeBps: undefined }), 100).protocolFeeBps,
    ).toBeUndefined()
    expect(sellQuoteSummary(taoToUsdc({ protocolFeeBps: 1.5 }), 100).protocolFeeBps).toBeUndefined()
  })
})
