import type { Quote } from "@tao.com/intents-sdk"

import { isProtocolFeeBps, rawToNumber, swapMinOutput } from "./amounts"

/**
 * What a sell shows about a quote: what is received, the least that may arrive, the costs and the
 * ETA. Display only, never logic that decides a payment: the Quoter's fee fields are
 * "informational", and one route sends nonsense in them. Ported from the website.
 */

/** The parts of a `Quote` read here. */
export type QuoteSummaryInput = Pick<
  Quote,
  "inputAmount" | "outputAmount" | "inputUsd" | "outputUsd"
> & {
  inputToken: Pick<Quote["inputToken"], "decimals">
  fees?: Quote["fees"]
  protocolFeeBps?: Quote["protocolFeeBps"]
  raw?: unknown
}

/** A USD amount the Quoter sent as text, or `undefined`. */
export function parseUsd(text: string | undefined | null): number | undefined {
  if (text === undefined || text === null || text.trim() === "") return undefined
  const value = Number(text)
  return Number.isFinite(value) ? value : undefined
}

/** Output per one unit of input (`1 TAO = 386.5 USDC` → 386.5), or `undefined` when nothing is paid. */
export function quoteRate(quote: QuoteSummaryInput, outputDecimals: number): number | undefined {
  const input = rawToNumber(quote.inputAmount, quote.inputToken.decimals)
  const output = rawToNumber(quote.outputAmount, outputDecimals)
  return input > 0 ? output / input : undefined
}

/** Share of `inputUsd` that `fees.sellUsd` may be off by and still be trusted. */
const FEE_BREAKDOWN_TOLERANCE = 0.05

export type QuoteCostBreakdown = {
  serviceUsd: number | undefined
  solverUsd: number | undefined
  /** Gas the solver pays to deliver on the destination chain. */
  networkGasUsd: number | undefined
  /** Pool fee plus price impact of the swap into the output, in bps. */
  priceImpactBps: number | undefined
}

export type QuoteCosts = {
  /**
   * What the swap costs in USD: what is paid less what is received (`inputUsd − outputUsd`), never
   * below zero. Read this way because it holds on every route; `fees.totalUsd` came back as `"0"`
   * for an alpha input.
   */
  totalUsd: number | undefined
  /**
   * The Quoter's own fee split, only when it describes this swap: its `sellUsd` within 5% of
   * `inputUsd` (an alpha input's came back as `"0.000002"`).
   */
  breakdown: QuoteCostBreakdown | undefined
}

export function quoteCosts(quote: QuoteSummaryInput): QuoteCosts {
  const inputUsd = parseUsd(quote.inputUsd)
  const outputUsd = parseUsd(quote.outputUsd)
  const totalUsd =
    inputUsd !== undefined && outputUsd !== undefined
      ? Math.max(0, inputUsd - outputUsd)
      : undefined

  const fees = quote.fees
  const sellUsd = parseUsd(fees?.sellUsd)
  const trusted =
    fees !== undefined &&
    inputUsd !== undefined &&
    inputUsd > 0 &&
    sellUsd !== undefined &&
    Math.abs(sellUsd - inputUsd) <= inputUsd * FEE_BREAKDOWN_TOLERANCE

  const priceImpactBps = fees?.poolSlippageBps
  return {
    totalUsd,
    breakdown: trusted
      ? {
          serviceUsd: parseUsd(fees.serviceUsd),
          solverUsd: parseUsd(fees.solverUsd),
          networkGasUsd: parseUsd(fees.fillGasUsd),
          priceImpactBps:
            typeof priceImpactBps === "number" && Number.isFinite(priceImpactBps)
              ? priceImpactBps
              : undefined,
        }
      : undefined,
  }
}

/** The Quoter's delivery estimate (`raw.eta`, seconds), or `undefined`. */
export function quoteEtaSeconds(raw: unknown): number | undefined {
  if (raw === null || typeof raw !== "object") return undefined
  const eta = Number((raw as { eta?: unknown }).eta)
  return Number.isFinite(eta) && eta > 0 ? eta : undefined
}

/**
 * An ETA as it is said: seconds under a minute, otherwise whole minutes rounded up (a swap that
 * arrives before its estimate is a pleasant surprise; one that arrives after is a worry).
 */
export function etaDisplay(seconds: number): { unit: "seconds" | "minutes"; count: number } {
  if (seconds < 60) return { unit: "seconds", count: Math.max(1, Math.ceil(seconds)) }
  return { unit: "minutes", count: Math.ceil(seconds / 60) }
}

/** The least the swap may deliver at this slippage, in the output's base units. */
export const minimumReceivedRaw = (quote: Pick<Quote, "outputAmount">, slippageBps: number) =>
  swapMinOutput(quote.outputAmount, slippageBps)

/** Everything the form and the review show about one sell quote. */
export type SellQuoteSummary = {
  /** What the quote delivers, in the output's base units. */
  receiveRaw: bigint
  /** The least that may arrive: `receiveRaw` less slippage. */
  minReceiveRaw: bigint
  /** USD paid and received, when the Quoter priced them. */
  inputUsd: number | undefined
  outputUsd: number | undefined
  costs: QuoteCosts
  /** The protocol fee the Intents contract keeps when the order opens (30 on 2026-11-05). */
  protocolFeeBps: number | undefined
  etaSeconds: number | undefined
}

export function sellQuoteSummary(quote: QuoteSummaryInput, slippageBps: number): SellQuoteSummary {
  return {
    receiveRaw: quote.outputAmount,
    minReceiveRaw: minimumReceivedRaw(quote, slippageBps),
    inputUsd: parseUsd(quote.inputUsd),
    outputUsd: parseUsd(quote.outputUsd),
    costs: quoteCosts(quote),
    protocolFeeBps: isProtocolFeeBps(quote.protocolFeeBps) ? quote.protocolFeeBps : undefined,
    etaSeconds: quoteEtaSeconds(quote.raw),
  }
}
