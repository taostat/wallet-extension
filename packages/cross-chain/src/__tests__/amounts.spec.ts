import {
  ALPHA_DECIMALS,
  canonicalAmount,
  ETH_DECIMALS,
  formatRawAmount,
  isProtocolFeeBps,
  parseAmountToRaw,
  quoteInputRao,
  rawToNumber,
  swapMinOutput,
  TAO_DECIMALS,
  USDC_DECIMALS,
  withoutProtocolFee,
} from "../amounts"

describe("quoteInputRao", () => {
  it("turns native TAO's 18-decimal amount into rao", () => {
    expect(
      quoteInputRao({ inputAmount: 1_500_000_000_000_000_000n, inputToken: { decimals: 18 } }),
    ).toBe(1_500_000_000n)
  })

  it("keeps alpha's rao as is", () => {
    expect(quoteInputRao({ inputAmount: 1_500_000_000n, inputToken: { decimals: 9 } })).toBe(
      1_500_000_000n,
    )
  })

  it("scales up a token with fewer decimals", () => {
    expect(quoteInputRao({ inputAmount: 1_500_000n, inputToken: { decimals: 6 } })).toBe(
      1_500_000_000n,
    )
  })
})

describe("decimals", () => {
  it("reads rao, alpha, USDC and ETH with their own decimals", () => {
    expect([TAO_DECIMALS, ALPHA_DECIMALS, USDC_DECIMALS, ETH_DECIMALS]).toEqual([9, 9, 6, 18])
    expect(parseAmountToRaw("1", TAO_DECIMALS)).toBe(1_000_000_000n)
    expect(parseAmountToRaw("1", USDC_DECIMALS)).toBe(1_000_000n)
    expect(parseAmountToRaw("1", ETH_DECIMALS)).toBe(1_000_000_000_000_000_000n)
  })
})

describe("parseAmountToRaw", () => {
  it("converts dot-decimals to base units", () => {
    expect(parseAmountToRaw("100", 6)).toBe(100_000_000n)
    expect(parseAmountToRaw("1.5", 6)).toBe(1_500_000n)
    expect(parseAmountToRaw("0.000001", 6)).toBe(1n)
    expect(parseAmountToRaw(".5", 9)).toBe(500_000_000n)
    expect(parseAmountToRaw("2.", 9)).toBe(2_000_000_000n)
    expect(parseAmountToRaw("0", 9)).toBe(0n)
    expect(parseAmountToRaw("1.25", 18)).toBe(1_250_000_000_000_000_000n)
  })

  it("cuts digits past the decimals, never rounding up", () => {
    expect(parseAmountToRaw("1.1234567", 6)).toBe(1_123_456n)
    expect(parseAmountToRaw("0.9999999999", 9)).toBe(999_999_999n)
    expect(parseAmountToRaw("0.0000000009", 9)).toBe(0n)
  })

  it("keeps precision beyond Number.MAX_SAFE_INTEGER", () => {
    expect(parseAmountToRaw("123456789012.123456789012345678", 18)).toBe(
      123_456_789_012_123_456_789_012_345_678n,
    )
  })

  it("refuses garbage", () => {
    for (const text of [
      "",
      ".",
      "-1",
      "+1",
      "1e3",
      "1,5",
      "1,000",
      " 1",
      "1 ",
      "1.2.3",
      "abc",
      "0x10",
      "Infinity",
      "NaN",
      "1".repeat(81),
    ])
      expect(parseAmountToRaw(text, 9)).toBeNull()
  })
})

describe("formatRawAmount", () => {
  it("writes base units as a plain dot-decimal without trailing zeros", () => {
    expect(formatRawAmount(1_500_000n, 6)).toBe("1.5")
    expect(formatRawAmount(100_000_000n, 6)).toBe("100")
    expect(formatRawAmount(1n, 9)).toBe("0.000000001")
    expect(formatRawAmount(0n, 18)).toBe("0")
    expect(formatRawAmount(1_234_567_890_123_456_789_012n, 18)).toBe("1234.567890123456789012")
    expect(formatRawAmount(-1_500_000n, 6)).toBe("-1.5")
  })

  it("round-trips with parseAmountToRaw", () => {
    for (const text of ["0.1", "42", "0.000000001", "98765.4321"])
      expect(formatRawAmount(parseAmountToRaw(text, 9) ?? -1n, 9)).toBe(text)
  })
})

describe("canonicalAmount", () => {
  it("normalises a positive amount, and is null for zero or garbage", () => {
    expect(canonicalAmount("001.500", 6)).toBe("1.5")
    expect(canonicalAmount("1.0000000001", 9)).toBe("1")
    expect(canonicalAmount("0.0000000001", 9)).toBeNull()
    expect(canonicalAmount("0", 9)).toBeNull()
    expect(canonicalAmount("x", 9)).toBeNull()
  })
})

describe("rawToNumber", () => {
  it("reads base units as a number", () => {
    expect(rawToNumber(1_500_000n, 6)).toBe(1.5)
    expect(rawToNumber(386_000_000_000_000_000n, 18)).toBeCloseTo(0.386, 12)
    expect(rawToNumber(0n, 9)).toBe(0)
  })
})

describe("swapMinOutput", () => {
  it("takes the tolerance off a quoted output, rounding down", () => {
    // 386.5 USDC quoted, 1% → 382.635
    expect(swapMinOutput(386_500_000n, 100)).toBe(382_635_000n)
    // 0.12345 ETH quoted, 0.5%
    expect(swapMinOutput(123_450_000_000_000_000n, 50)).toBe(122_832_750_000_000_000n)
    expect(swapMinOutput(999n, 50)).toBe(994n)
  })

  it("is 0 for nothing, and refuses a tolerance that isn't whole bps from 0 to 10 000", () => {
    expect(swapMinOutput(0n, 100)).toBe(0n)
    expect(swapMinOutput(-5n, 100)).toBe(0n)
    expect(swapMinOutput(1_000n, 0)).toBe(1_000n)
    expect(swapMinOutput(1_000n, 10_000)).toBe(0n)
    expect(() => swapMinOutput(1_000n, 1.5)).toThrow(RangeError)
    expect(() => swapMinOutput(1_000n, -1)).toThrow(RangeError)
    expect(() => swapMinOutput(1_000n, 10_001)).toThrow(RangeError)
  })
})

describe("withoutProtocolFee", () => {
  it("takes the fee off in base units, with no float drift", () => {
    // 10 USDC at 30 bps: the 2026-11-05 order escrowed 9.97.
    expect(withoutProtocolFee(10_000_000n, 30)).toBe(9_970_000n)
    expect(withoutProtocolFee(10_000_000n, 0)).toBe(10_000_000n)
    expect(withoutProtocolFee(10_000_000n, 10_000)).toBe(0n)
  })

  it("rounds the fee down", () => {
    expect(withoutProtocolFee(1n, 30)).toBe(1n)
  })

  it("refuses a fee that isn't whole bps from 0 to 10 000", () => {
    expect(withoutProtocolFee(10n, 1.5)).toBeUndefined()
    expect(withoutProtocolFee(10n, -1)).toBeUndefined()
    expect(withoutProtocolFee(10n, 10_001)).toBeUndefined()
    expect(isProtocolFeeBps(30)).toBe(true)
    expect(isProtocolFeeBps("30")).toBe(false)
  })
})
