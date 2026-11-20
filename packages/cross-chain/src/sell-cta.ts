import type { CrossChainErrorCode } from "./error-codes"
import { isSilentError } from "./error-codes"
import { parseUsd } from "./quote-summary"
import { MIN_SELL_USD } from "./sell"

/**
 * What the sell form's one button says and does. A pure function of the form, so the order of the
 * checks is in one place: the first that fails wins. The website's `cta-state.ts`, for a sell
 * (the account is fixed by the entry point, and Bittensor mainnet is the only network), plus the
 * minimum sell (`MIN_SELL_USD`).
 */

export type SellCtaInput = {
  /** A positive amount is typed. */
  hasAmount: boolean
  /** The typed recipient: none yet, not a valid Ethereum address, or valid. */
  recipientStatus: "missing" | "invalid" | "valid"
  /** `sellShortfall` for the amount. */
  shortfall: "balance" | "fee" | null
  quote: {
    hasQuote: boolean
    /** The quote shown is not for what is typed now (or its refresh failed). */
    isStale: boolean
    /** A quote for what is typed now is on its way. */
    isFetching: boolean
    errorCode: CrossChainErrorCode | undefined
  }
  /** `isBelowMinimumSell` for the quote shown. */
  belowMinimum: boolean
}

export type SellCtaState =
  | { kind: "enterAmount" }
  | { kind: "recipientMissing" }
  | { kind: "recipientInvalid" }
  | { kind: "insufficientBalance" }
  | { kind: "insufficientFeeBalance" }
  | { kind: "quoting" }
  | { kind: "quoteError"; code: CrossChainErrorCode }
  /** The quote prices the sell under `MIN_SELL_USD`. */
  | { kind: "belowMinimum" }
  | { kind: "review" }

export function resolveSellCta(input: SellCtaInput): SellCtaState {
  if (!input.hasAmount) return { kind: "enterAmount" }
  if (input.recipientStatus === "missing") return { kind: "recipientMissing" }
  if (input.recipientStatus === "invalid") return { kind: "recipientInvalid" }
  if (input.shortfall === "balance") return { kind: "insufficientBalance" }
  if (input.shortfall === "fee") return { kind: "insufficientFeeBalance" }

  const { hasQuote, isStale, isFetching, errorCode } = input.quote
  // A background refresh of a current quote keeps the button ready: the review takes a firm quote
  // of its own anyway.
  if (isFetching && (!hasQuote || isStale)) return { kind: "quoting" }
  if (errorCode !== undefined && !isSilentError(errorCode))
    return { kind: "quoteError", code: errorCode }
  // No quote yet and none failing: one is about to be asked for.
  if (!hasQuote) return { kind: "quoting" }
  if (input.belowMinimum) return { kind: "belowMinimum" }
  return { kind: "review" }
}

/**
 * Whether the quote shown prices the sell under `MIN_SELL_USD`. Only a quote for what is typed now
 * counts (not a stale one), and only a USD value the Quoter gave: a missing, unreadable, zero or
 * negative `inputUsd` is a sell it didn't price, and never blocks. Compared in whole cents, as the
 * form shows it, so a sell shown as "$10.00" is never told to sell at least $10.00.
 */
export function isBelowMinimumSell({
  hasQuote,
  isStale,
  inputUsd,
}: {
  hasQuote: boolean
  isStale: boolean
  /** The quote's `inputUsd`, as the Quoter sent it. */
  inputUsd: string | null | undefined
}): boolean {
  if (!hasQuote || isStale) return false
  const usd = parseUsd(inputUsd)
  if (usd === undefined || usd <= 0) return false
  // `toPrecision` first: 9.995 * 100 is 999.4999…, which would round down where the display shows
  // "$10.00".
  return Math.round(Number((usd * 100).toPrecision(12))) < MIN_SELL_USD * 100
}

/** The short button label for a failed quote (the full message goes in the notice above it). */
export type QuoteErrorCtaLabel = "tryAnotherAmount" | "rateLimited" | "paused" | "noQuote"

export function quoteErrorCtaLabel(code: CrossChainErrorCode): QuoteErrorCtaLabel {
  switch (code) {
    case "noRoute":
    case "swapQuoteFailed":
      return "tryAnotherAmount"
    case "rateLimited":
      return "rateLimited"
    case "paused":
      return "paused"
    default:
      return "noQuote"
  }
}
