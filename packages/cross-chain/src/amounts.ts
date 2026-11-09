/**
 * Amounts as a sell holds them: dot-decimal strings while typed, raw `bigint` base units for maths.
 * Nothing here rounds up: extra digits are cut off. Ported from the website's cross-chain swap.
 */

/** TAO paid from a coldkey, in rao. */
export const TAO_DECIMALS = 9
/** Subnet alpha, in rao. */
export const ALPHA_DECIMALS = 9
/** USDC on Ethereum. */
export const USDC_DECIMALS = 6
/** ETH, in wei. */
export const ETH_DECIMALS = 18

const DECIMAL_TEXT = /^(?<whole>\d*)(?:\.(?<fraction>\d*))?$/
/** Longest amount text taken at all: no real amount needs more. */
const MAX_AMOUNT_TEXT_LENGTH = 80

/**
 * Base units of a dot-decimal amount (`"1.5"` with 6 decimals → `1500000n`). Digits past
 * `decimals` are dropped (never rounded up). `null` for anything that is not a plain non-negative
 * decimal: empty, signs, exponents, group separators, spaces, a lone `"."`.
 */
export function parseAmountToRaw(text: string, decimals: number): bigint | null {
  if (text.length === 0 || text.length > MAX_AMOUNT_TEXT_LENGTH) return null
  const groups = DECIMAL_TEXT.exec(text)?.groups
  if (!groups) return null
  const whole = groups.whole ?? ""
  const fraction = groups.fraction ?? ""
  if (whole.length === 0 && fraction.length === 0) return null
  const kept = fraction.slice(0, decimals).padEnd(decimals, "0")
  return BigInt(`${whole || "0"}${kept}`)
}

/**
 * A raw amount as a dot-decimal string for an input or the SDK's `amount`: no grouping, no
 * trailing zeros (`1500000n` with 6 decimals → `"1.5"`).
 */
export function formatRawAmount(raw: bigint, decimals: number): string {
  const negative = raw < 0n
  const digits = (negative ? -raw : raw).toString().padStart(decimals + 1, "0")
  const whole = digits.slice(0, digits.length - decimals)
  const fraction = digits.slice(digits.length - decimals).replace(/0+$/, "")
  return `${negative ? "-" : ""}${whole}${fraction ? `.${fraction}` : ""}`
}

/**
 * The amount in the canonical form the SDK and query keys get: truncated to `decimals`, no
 * trailing zeros. `null` when the text is not an amount or is zero.
 */
export function canonicalAmount(text: string, decimals: number): string | null {
  const raw = parseAmountToRaw(text, decimals)
  return raw === null || raw === 0n ? null : formatRawAmount(raw, decimals)
}

/**
 * A quote's paid amount in rao (9 decimals), whatever unit the SDK holds it in: native TAO on
 * Subtensor EVM has 18 decimals (wei), alpha has 9. Sells only pay whole rao, so no digit is lost.
 */
export function quoteInputRao(quote: {
  inputAmount: bigint
  inputToken: { decimals: number }
}): bigint {
  const shift = quote.inputToken.decimals - TAO_DECIMALS
  if (shift === 0) return quote.inputAmount
  return shift > 0
    ? quote.inputAmount / 10n ** BigInt(shift)
    : quote.inputAmount * 10n ** BigInt(-shift)
}

/** A base-unit amount as a number, for display and USD maths only. */
export function rawToNumber(raw: bigint, decimals: number): number {
  const scale = 10n ** BigInt(decimals)
  const whole = raw / scale
  const fraction = raw % scale
  return Number(whole) + Number(fraction) / Number(scale)
}

/** Basis points in a whole (10 000 bps = 100%). */
const BPS_PER_WHOLE = 10_000n

/**
 * The least a swap may deliver once a slippage tolerance is taken off the quoted output:
 * `floor(amount · (10 000 − slippageBps) / 10 000)`, in the output's base units. `0n` when the
 * amount is not positive. Throws for a tolerance that isn't a whole number from 0 to 10 000: a
 * floor from a bad tolerance would refuse every quote or accept any, so it is not guessed.
 */
export function swapMinOutput(amountRaw: bigint, slippageBps: number): bigint {
  if (!Number.isInteger(slippageBps) || slippageBps < 0 || slippageBps > Number(BPS_PER_WHOLE))
    throw new RangeError(
      `slippageBps must be a whole number from 0 to ${BPS_PER_WHOLE}, got ${slippageBps}`,
    )
  if (amountRaw <= 0n) return 0n
  return (amountRaw * (BPS_PER_WHOLE - BigInt(slippageBps))) / BPS_PER_WHOLE
}

/** A protocol fee as the Intents contract takes it: whole bps, 0 to 100%. */
export const isProtocolFeeBps = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 10_000

/**
 * What the order escrows of `raw` paid in (and refunds if unfilled): the amount less the protocol
 * fee, the fee rounded down (10 USDC at 30 bps → 9.97). `undefined` for a fee that isn't 0–10000
 * whole bps.
 */
export function withoutProtocolFee(raw: bigint, bps: number): bigint | undefined {
  if (!isProtocolFeeBps(bps)) return undefined
  return raw - (raw * BigInt(bps)) / BPS_PER_WHOLE
}
