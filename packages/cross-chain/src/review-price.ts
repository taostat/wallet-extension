import type { Quote } from "@tao.com/intents-sdk"

import { isProtocolFeeBps, swapMinOutput } from "./amounts"
import { parseUsd } from "./quote-summary"

/**
 * The review's price rules, ported from the website. The user accepts an output (the quote they
 * clicked Review on, or a new price they accepted); refreshed quotes are measured against it:
 *
 * - better: shown, and it becomes the floor's base without asking (the floor only rises);
 * - worse, but within the slippage setting: shown, nothing to accept;
 * - below the accepted output less slippage: "The price moved" with the new amount, and the button
 *   asks to accept it before anything is signed.
 *
 * The swap is sent with `minOutputAmount` = the base less slippage, so nothing worse than what the
 * user accepted is ever signed.
 */

export type ReviewPrice = {
  /** What the floor is taken from: the accepted output, or a better latest. */
  baseOutput: bigint
  /** The least the swap may deliver: `swapMinOutput(baseOutput, slippage)`. */
  minOutput: bigint
  /** The latest firm quote is below `minOutput`: ask before signing. */
  hasMoved: boolean
}

export function reviewPrice({
  acceptedOutput,
  latestOutput,
  slippageBps,
}: {
  acceptedOutput: bigint
  /** The latest firm quote's output, `undefined` until one arrives. */
  latestOutput: bigint | undefined
  slippageBps: number
}): ReviewPrice {
  const baseOutput =
    latestOutput !== undefined && latestOutput > acceptedOutput ? latestOutput : acceptedOutput
  const minOutput = swapMinOutput(baseOutput, slippageBps)
  return {
    baseOutput,
    minOutput,
    hasMoved: latestOutput !== undefined && latestOutput < minOutput,
  }
}

/**
 * Whether an `OUTPUT_BELOW_MINIMUM` from the swap is still waiting for the new price: until a
 * quote newer than the failure has arrived, the review says the price moved and doesn't let the
 * user confirm.
 */
export const isAwaitingMovedPrice = (
  priceMovedAt: number | undefined,
  quoteUpdatedAt: number,
): boolean => priceMovedAt !== undefined && quoteUpdatedAt <= priceMovedAt

/** What a refund returns if the order isn't filled. */
export type RefundEstimate =
  /** TAO or alpha paid: it was swapped into about this much USDC. */
  | { kind: "approx"; usdc: number }
  /** Nothing prices it. */
  | { kind: "unknown" }

/**
 * Refunds are always USDC on the origin chain (Bittensor EVM, at the account's EVM address for a
 * sell), and they return what the order escrowed: the USDC the TAO or alpha was swapped into
 * (about its USD value), less the protocol fee the contract keeps when the order opens
 * (`quote.protocolFeeBps`). Without a known fee, about the USD value as quoted.
 */
export function refundEstimate(
  quote: Pick<Quote, "inputUsd"> & Partial<Pick<Quote, "protocolFeeBps">>,
): RefundEstimate {
  const usd = parseUsd(quote.inputUsd)
  if (usd === undefined || usd <= 0) return { kind: "unknown" }
  const bps = isProtocolFeeBps(quote.protocolFeeBps) ? quote.protocolFeeBps : undefined
  return { kind: "approx", usdc: bps === undefined ? usd : usd * (1 - bps / 10_000) }
}

/** What the review's main button says and does. */
export type ReviewCta =
  | { kind: "confirm" }
  /** The price moved past the floor: accept the new one before signing. */
  | { kind: "acceptPrice" }
  /** No firm quote yet, or a new one is awaited after the price moved. */
  | { kind: "gettingPrice" }
  /** The review's quote failed: nothing current to sign. */
  | { kind: "quoteError" }
  /** The account can't sign yet (the chain's metadata is loading). */
  | { kind: "walletNotReady" }

/**
 * The review's main button, first match wins: an unready signer, then no current price, then a
 * moved price, else confirm.
 */
export function resolveReviewCta({
  signerReady,
  hasQuote,
  quoteFailed,
  awaitingMovedPrice,
  hasMoved,
}: {
  signerReady: boolean
  /** A firm quote from the review itself has arrived. */
  hasQuote: boolean
  /** Its last refresh failed in a way that leaves nothing to confirm. */
  quoteFailed: boolean
  awaitingMovedPrice: boolean
  hasMoved: boolean
}): ReviewCta {
  if (!signerReady) return { kind: "walletNotReady" }
  if (quoteFailed) return { kind: "quoteError" }
  if (!hasQuote || awaitingMovedPrice) return { kind: "gettingPrice" }
  if (hasMoved) return { kind: "acceptPrice" }
  return { kind: "confirm" }
}
