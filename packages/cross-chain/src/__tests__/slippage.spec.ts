import {
  bpsToPercent,
  DEFAULT_SLIPPAGE_BPS,
  isValidSlippageBps,
  MAX_SLIPPAGE_BPS,
  MIN_SLIPPAGE_BPS,
  normalizeSlippageBps,
  parseSlippagePercent,
  SLIPPAGE_PRESETS_BPS,
  slippageBpsToPercentText,
} from "../slippage"

describe("slippage", () => {
  it("uses the website's default, presets and bounds", () => {
    expect(DEFAULT_SLIPPAGE_BPS).toBe(100)
    expect(SLIPPAGE_PRESETS_BPS).toEqual([50, 100, 200])
    expect([MIN_SLIPPAGE_BPS, MAX_SLIPPAGE_BPS]).toEqual([1, 1_000])
  })

  it("reads a typed percentage as basis points", () => {
    expect(parseSlippagePercent("0.5")).toEqual({ ok: true, bps: 50 })
    expect(parseSlippagePercent("1")).toEqual({ ok: true, bps: 100 })
    expect(parseSlippagePercent("2.345")).toEqual({ ok: true, bps: 235 })
    expect(parseSlippagePercent("10")).toEqual({ ok: true, bps: 1000 })
  })

  it("refuses empty, too low and too high values", () => {
    expect(parseSlippagePercent("")).toEqual({ ok: false, reason: "empty" })
    expect(parseSlippagePercent("abc")).toEqual({ ok: false, reason: "empty" })
    expect(parseSlippagePercent("0")).toEqual({ ok: false, reason: "tooLow" })
    expect(parseSlippagePercent("0.004")).toEqual({ ok: false, reason: "tooLow" })
    expect(parseSlippagePercent("10.01")).toEqual({ ok: false, reason: "tooHigh" })
  })

  it("falls back to the default for a value that is not valid", () => {
    expect(normalizeSlippageBps(50)).toBe(50)
    expect(normalizeSlippageBps("50")).toBe(100)
    expect(normalizeSlippageBps(0)).toBe(100)
    expect(normalizeSlippageBps(5000)).toBe(100)
    expect(normalizeSlippageBps(1.5)).toBe(100)
    expect(isValidSlippageBps(1)).toBe(true)
    expect(isValidSlippageBps(1001)).toBe(false)
  })

  it("shows basis points as a percentage", () => {
    expect(slippageBpsToPercentText(50)).toBe("0.5")
    expect(slippageBpsToPercentText(235)).toBe("2.35")
    expect(bpsToPercent(100)).toBe(1)
  })
})
