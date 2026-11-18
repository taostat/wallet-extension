import {
  BittensorSwapQuote,
  getAverageSwapPrice,
  getEndPrice,
  getLimitPrice,
  getMinimumAmountOut,
  getPriceImpact,
  getPriceImpactLevel,
  getWorstCasePrice,
} from "../helpers"

const UNIT = 1_000_000_000n // rao per TAO / alpha

/**
 * Equal-weight pool (price = taoReserve / alphaReserve), the shape of subtensor pools on mainnet.
 * Swap fees go to the block author, so they don't change reserves and are left out here.
 */
const pool = (taoReserve: bigint, alphaReserve: bigint) => {
  const spotPrice = (taoReserve * UNIT) / alphaReserve

  const unstake = (alphaIn: bigint): BittensorSwapQuote => ({
    simulation: {
      tao_amount: (taoReserve * alphaIn) / (alphaReserve + alphaIn),
      alpha_amount: alphaIn,
      tao_fee: 0n,
      alpha_fee: 0n,
    },
    spotPrice,
    taoReserve,
    alphaReserve,
  })

  const stake = (taoIn: bigint): BittensorSwapQuote => ({
    simulation: {
      tao_amount: taoIn,
      alpha_amount: (alphaReserve * taoIn) / (taoReserve + taoIn),
      tao_fee: 0n,
      alpha_fee: 0n,
    },
    spotPrice,
    taoReserve,
    alphaReserve,
  })

  return { spotPrice, stake, unstake }
}

/**
 * Mirrors subtensor's fill-or-kill check (`allow_partial: false`): the full swap must not push the pool
 * price past `limit_price`. Prices compared exactly as rationals.
 */
const chainAccepts = (quote: BittensorSwapQuote, isStake: boolean, limitPrice: bigint) => {
  const { simulation, taoReserve, alphaReserve } = quote
  const taoAfter = isStake ? taoReserve + simulation.tao_amount : taoReserve - simulation.tao_amount
  const alphaAfter = isStake
    ? alphaReserve - simulation.alpha_amount
    : alphaReserve + simulation.alpha_amount
  // end price (rao/alpha) = taoAfter * UNIT / alphaAfter
  return isStake
    ? taoAfter * UNIT <= limitPrice * alphaAfter
    : taoAfter * UNIT >= limitPrice * alphaAfter
}

/** Previous behaviour: limit built from the average fill price. */
const averagePriceLimit = (quote: BittensorSwapQuote, isStake: boolean, tolerance: number) => {
  const avg = getAverageSwapPrice(quote.simulation)
  const scaled = BigInt(Math.round(tolerance * 10_000))
  return isStake ? (avg * (10_000n + scaled)) / 10_000n : (avg * (10_000n - scaled)) / 10_000n
}

// SN85 at mainnet block ~9344195, from taostat/wallet-extension#18
const SN85 = pool(12_550_410_000_000n, 2_558_190_000_000_000n)

describe("Bittensor stake limit price", () => {
  describe("issue #18 repro (SN85 unstakes)", () => {
    const failedUnstakes = [23_440_830_000_000n, 20_383_330_000_000n] // 23,440.83 α and 20,383.33 α

    it.each(failedUnstakes)(
      "the old average-price limit is rejected by the chain (%s)",
      (alpha) => {
        const quote = SN85.unstake(alpha)
        expect(chainAccepts(quote, false, averagePriceLimit(quote, false, 0.005))).toBe(false)
      },
    )

    it.each(failedUnstakes)("the end-price limit is accepted by the chain (%s)", (alpha) => {
      const quote = SN85.unstake(alpha)
      const endPrice = getEndPrice(quote, "alphaToTao")!
      expect(chainAccepts(quote, false, getLimitPrice(endPrice, "alphaToTao", 0.005))).toBe(true)
    })

    it("shows the average fill price against spot as price impact, half the pool movement", () => {
      const quote = SN85.unstake(23_440_830_000_000n)
      const endPrice = getEndPrice(quote, "alphaToTao")!
      // what the user pays: ~0.9% worse than spot on average
      expect(getPriceImpact(SN85.spotPrice, getAverageSwapPrice(quote.simulation))).toBeCloseTo(
        0.91,
        1,
      )
      // the pool itself moves ~1.8%, which the limit price has to allow for
      expect(getPriceImpact(SN85.spotPrice, endPrice)).toBeCloseTo(1.82, 1)
    })
  })

  describe("getEndPrice", () => {
    it("matches the pool price after a stake, rounded up", () => {
      const quote = SN85.stake(500n * UNIT)
      const { tao_amount, alpha_amount } = quote.simulation
      const exact = ((quote.taoReserve + tao_amount) * UNIT) / (quote.alphaReserve - alpha_amount)
      const endPrice = getEndPrice(quote, "taoToAlpha")!
      expect(endPrice).toBeGreaterThanOrEqual(exact)
      expect(endPrice - exact).toBeLessThanOrEqual(3n)
    })

    it("matches the pool price after an unstake, rounded down", () => {
      const quote = SN85.unstake(50_000n * UNIT)
      const { tao_amount, alpha_amount } = quote.simulation
      const exact = ((quote.taoReserve - tao_amount) * UNIT) / (quote.alphaReserve + alpha_amount)
      const endPrice = getEndPrice(quote, "alphaToTao")!
      expect(endPrice).toBeLessThanOrEqual(exact)
      expect(exact - endPrice).toBeLessThanOrEqual(3n)
    })

    it("keeps the pool weight factor carried by the spot price", () => {
      // weights 0.6 / 0.4: price = 1.5 * tao / alpha
      const base = SN85.stake(500n * UNIT)
      const quote = { ...base, spotPrice: (base.spotPrice * 3n) / 2n }
      const plain = getEndPrice(base, "taoToAlpha")!
      const weighted = getEndPrice(quote, "taoToAlpha")!
      expect(Number(weighted) / Number(plain)).toBeCloseTo(1.5, 6)
    })

    it("returns null when the pool cannot be priced", () => {
      const quote = SN85.stake(UNIT)
      expect(getEndPrice({ ...quote, spotPrice: 0n }, "taoToAlpha")).toBeNull()
      expect(getEndPrice({ ...quote, alphaReserve: 0n }, "taoToAlpha")).toBeNull()
      expect(
        getEndPrice(
          { ...quote, simulation: { ...quote.simulation, alpha_amount: quote.alphaReserve } },
          "taoToAlpha",
        ),
      ).toBeNull()
    })
  })

  describe("end-price limit", () => {
    const sizes = [1n, 100n, 1_000n, 10_000n, 100_000n].map((n) => n * UNIT)

    it.each(sizes)("accepts a stake of %s rao with no price movement at 0%% tolerance", (tao) => {
      const quote = SN85.stake(tao)
      const limit = getLimitPrice(getEndPrice(quote, "taoToAlpha")!, "taoToAlpha", 0)
      expect(chainAccepts(quote, true, limit)).toBe(true)
    })

    it.each(sizes.map((n) => n * 200n))(
      "accepts an unstake of %s rao with no price movement at 0%% tolerance",
      (alpha) => {
        const quote = SN85.unstake(alpha)
        const limit = getLimitPrice(getEndPrice(quote, "alphaToTao")!, "alphaToTao", 0)
        expect(chainAccepts(quote, false, limit)).toBe(true)
      },
    )

    it("rejects a stake if the pool moves further than the tolerance before it lands", () => {
      const quote = SN85.stake(1_000n * UNIT)
      const limit = getLimitPrice(getEndPrice(quote, "taoToAlpha")!, "taoToAlpha", 0.005)

      const { taoReserve, alphaReserve } = quote
      // scaling tao by f and alpha by 1/f moves the price by f^2

      // someone buys first and moves the price ~0.4%: inside tolerance
      const after04 = pool((taoReserve * 1002n) / 1000n, (alphaReserve * 1000n) / 1002n)
      expect(chainAccepts(after04.stake(1_000n * UNIT), true, limit)).toBe(true)

      // someone buys first and moves the price ~1%: outside tolerance
      const after1 = pool((taoReserve * 1005n) / 1000n, (alphaReserve * 1000n) / 1005n)
      expect(chainAccepts(after1.stake(1_000n * UNIT), true, limit)).toBe(false)
    })
  })

  describe("getPriceImpact", () => {
    it("is a positive percentage in both directions", () => {
      expect(getPriceImpact(1_000n, 1_020n)).toBe(2)
      expect(getPriceImpact(1_000n, 980n)).toBe(2)
      expect(getPriceImpact(1_000n, 1_000n)).toBe(0)
    })

    it("returns null without a spot price", () => {
      expect(getPriceImpact(0n, 1_000n)).toBeNull()
    })
  })

  describe("getPriceImpactLevel", () => {
    it.each([
      [null, "normal"],
      [0, "normal"],
      [1.99, "normal"],
      [2, "high"],
      [4.99, "high"],
      [5, "very-high"],
      [30, "very-high"],
    ] as const)("%s%% is %s", (impact, level) => {
      expect(getPriceImpactLevel(impact)).toBe(level)
    })
  })

  describe("worst case for the slippage tolerance", () => {
    it("moves the expected price against the user by the tolerance", () => {
      expect(getWorstCasePrice(1_122_000_000n, "taoToAlpha", 0.01)).toBe(1_133_220_000n)
      expect(getWorstCasePrice(1_078_000_000n, "alphaToTao", 0.01)).toBe(1_067_220_000n)
    })

    it("gives the least received at that price", () => {
      // buying: TAO in is fixed, so alpha out shrinks by 1 / (1 + tolerance)
      expect(getMinimumAmountOut(101_000n, "taoToAlpha", 0.01)).toBe(100_000n)
      // selling: alpha in is fixed, so TAO out shrinks by (1 - tolerance)
      expect(getMinimumAmountOut(100_000n, "alphaToTao", 0.01)).toBe(99_000n)
    })

    it("is close to what the chain allows when the pool moves by the tolerance first", () => {
      const tao = 1_000n * UNIT
      const quote = SN85.stake(tao)
      const expected = getAverageSwapPrice(quote.simulation)
      const worst = getWorstCasePrice(expected, "taoToAlpha", 0.01)
      const limit = getLimitPrice(getEndPrice(quote, "taoToAlpha")!, "taoToAlpha", 0.01)

      // someone buys first and moves the price just under 1%: still accepted
      const { taoReserve, alphaReserve } = quote
      const moved = pool((taoReserve * 10049n) / 10000n, (alphaReserve * 10000n) / 10049n)
      const after = moved.stake(tao)
      expect(chainAccepts(after, true, limit)).toBe(true)
      // and the average price actually paid is within 0.1% of the worst case shown
      const paid = getAverageSwapPrice(after.simulation)
      expect(Math.abs(Number(paid) / Number(worst) - 1)).toBeLessThan(0.001)
    })
  })
})
