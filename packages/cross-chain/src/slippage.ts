/**
 * The sell's max slippage, held in basis points (100 = 1%) and typed as a percentage (`"0.5"`).
 * The website's cross-chain settings: 1% by default, presets 0.5% / 1% / 2%, anything from 0.01% to
 * 10% typed. The swap of the TAO or alpha into USDC is held to 0.5–3% by `swapSlippageFor`.
 */

/** Default max slippage: 1%. */
export const DEFAULT_SLIPPAGE_BPS = 100
/** One-tap choices: 0.5%, 1%, 2%. */
export const SLIPPAGE_PRESETS_BPS = [50, 100, 200] as const
/** Lowest tolerance accepted: 0.01%. */
export const MIN_SLIPPAGE_BPS = 1
/** Highest tolerance accepted: 10%. */
export const MAX_SLIPPAGE_BPS = 1_000

const BPS_PER_PERCENT = 100

/** Whether `bps` is a whole number of basis points the form accepts. */
export const isValidSlippageBps = (bps: unknown): bps is number =>
  typeof bps === "number" &&
  Number.isInteger(bps) &&
  bps >= MIN_SLIPPAGE_BPS &&
  bps <= MAX_SLIPPAGE_BPS

/** A stored or passed-in value: anything not a valid tolerance is the default. */
export const normalizeSlippageBps = (value: unknown): number =>
  isValidSlippageBps(value) ? value : DEFAULT_SLIPPAGE_BPS

export type SlippageInputResult =
  | { ok: true; bps: number }
  | { ok: false; reason: "empty" | "tooLow" | "tooHigh" }

/**
 * A typed dot-decimal percentage in basis points: `"0.5"` → 50. Digits past 0.01% are rounded to
 * the nearest basis point. Below 0.01% or above 10% is refused.
 */
export function parseSlippagePercent(text: string): SlippageInputResult {
  const percent = Number(text)
  if (text.trim() === "" || !Number.isFinite(percent)) return { ok: false, reason: "empty" }
  const bps = Math.round(percent * BPS_PER_PERCENT)
  if (bps < MIN_SLIPPAGE_BPS) return { ok: false, reason: "tooLow" }
  if (bps > MAX_SLIPPAGE_BPS) return { ok: false, reason: "tooHigh" }
  return { ok: true, bps }
}

/** Basis points as the percentage text a field shows: 50 → `"0.5"`. */
export const slippageBpsToPercentText = (bps: number): string => String(bps / BPS_PER_PERCENT)

/** Basis points as a percentage number, for formatting: 50 → 0.5. */
export const bpsToPercent = (bps: number): number => bps / BPS_PER_PERCENT
