import type { OrderState } from "@tao.com/intents-sdk"

import type { CrossChainErrorCode } from "./error-codes"
import type { CrossChainSellRecord, SellRecordInput, SellRecordOutput } from "./sell-records"

/**
 * Analytics events of a cross-chain sell, as the website names them, sent through the wallet's
 * own analytics. Coarse on purpose: what kind of asset was sold (TAO or alpha) and for what (USDC or
 * ETH), the route as the website writes it, a USD bucket and `source: "extension"`. Never an
 * address, a hash, a netuid or an exact amount. SDK-free (the SDK import is a type).
 */

export const CROSS_CHAIN_EVENTS = {
  entryOpened: "cross_chain_entry_opened",
  reviewOpened: "cross_chain_review_opened",
  submitted: "cross_chain_swap_submitted",
  settled: "cross_chain_swap_settled",
  failed: "cross_chain_swap_failed",
  recoveryStarted: "cross_chain_recovery_started",
  recoveryFinished: "cross_chain_recovery_finished",
} as const

export type CrossChainEventName = (typeof CROSS_CHAIN_EVENTS)[keyof typeof CROSS_CHAIN_EVENTS]

/** Every event says it came from the wallet. */
export const CROSS_CHAIN_ANALYTICS_SOURCE = "extension"

export const USD_BUCKETS = ["<100", "100-1k", "1k-10k", "10k+"] as const
export type UsdBucket = (typeof USD_BUCKETS)[number]

export const isUsdBucket = (value: unknown): value is UsdBucket =>
  typeof value === "string" && (USD_BUCKETS as readonly string[]).includes(value)

/** The bucket a swap's USD value falls in; `undefined` when not priced. The website's. */
export function usdBucket(usd: number | undefined): UsdBucket | undefined {
  if (usd === undefined || !Number.isFinite(usd) || usd < 0) return undefined
  if (usd < 100) return "<100"
  if (usd < 1_000) return "100-1k"
  if (usd < 10_000) return "1k-10k"
  return "10k+"
}

export type CrossChainEvent = {
  name: CrossChainEventName
  data: Record<string, string>
}

/** What an event says about a sell. */
export type SellAnalyticsContext = {
  from: SellRecordInput["kind"]
  to: SellRecordOutput
  usdBucket?: string
}

/** The context of a saved sell. */
export const sellAnalyticsContext = (
  record: Pick<CrossChainSellRecord, "from" | "to" | "usdBucket">,
): SellAnalyticsContext => ({
  from: record.from.kind,
  to: record.to,
  ...(record.usdBucket !== undefined && { usdBucket: record.usdBucket }),
})

/** `bt:tao→eth:usdc`, as the website names a route (every subnet's alpha is `bt:alpha`). */
export const sellAnalyticsRoute = ({ from, to }: Pick<SellAnalyticsContext, "from" | "to">) =>
  `${from === "tao" ? "bt:tao" : "bt:alpha"}→${to === "USDC" ? "eth:usdc" : "eth:eth"}`

const baseData = (context: SellAnalyticsContext): Record<string, string> => ({
  route: sellAnalyticsRoute(context),
  from: context.from,
  to: context.to.toLowerCase(),
  source: CROSS_CHAIN_ANALYTICS_SOURCE,
  // An unknown bucket (a later version's) is left out.
  ...(isUsdBucket(context.usdBucket) && { usd: context.usdBucket }),
})

/** The sell modal opened from an asset row. */
export const entryOpenedEvent = (): CrossChainEvent => ({
  name: CROSS_CHAIN_EVENTS.entryOpened,
  data: { source: CROSS_CHAIN_ANALYTICS_SOURCE, direction: "sell" },
})

export const reviewOpenedEvent = (context: SellAnalyticsContext): CrossChainEvent => ({
  name: CROSS_CHAIN_EVENTS.reviewOpened,
  data: baseData(context),
})

/** The order opened (from the run, or found later by "Check again"). */
export const swapSubmittedEvent = (context: SellAnalyticsContext): CrossChainEvent => ({
  name: CROSS_CHAIN_EVENTS.submitted,
  data: baseData(context),
})

export const swapSettledEvent = (
  context: SellAnalyticsContext,
  state: Extract<OrderState, "filled" | "refunded">,
): CrossChainEvent => ({
  name: CROSS_CHAIN_EVENTS.settled,
  data: { ...baseData(context), state },
})

/** A run that ended without an open order. Not for the user's own cancel. */
export const swapFailedEvent = (
  context: SellAnalyticsContext,
  code: CrossChainErrorCode,
): CrossChainEvent => ({
  name: CROSS_CHAIN_EVENTS.failed,
  data: { ...baseData(context), code },
})

/** What a recovery brings back: a refund (USDC) or alpha. */
export type RecoveryKind = "refund" | "alpha"

/** How a recovery ended. */
export type RecoveryResult = "moved" | "nothingLeft" | "unconfirmed" | "failed"

export const recoveryStartedEvent = (kind: RecoveryKind): CrossChainEvent => ({
  name: CROSS_CHAIN_EVENTS.recoveryStarted,
  data: { kind, source: CROSS_CHAIN_ANALYTICS_SOURCE },
})

export const recoveryFinishedEvent = (
  kind: RecoveryKind,
  result: RecoveryResult,
  code?: CrossChainErrorCode,
): CrossChainEvent => ({
  name: CROSS_CHAIN_EVENTS.recoveryFinished,
  data: {
    kind,
    result,
    source: CROSS_CHAIN_ANALYTICS_SOURCE,
    ...(result === "failed" && code !== undefined && { code }),
  },
})
