import { useQuery } from "@tanstack/react-query"
import {
  buildSellQuoteParams,
  CrossChainErrorCode,
  Quote,
  SellInput,
  SellOutput,
  SellQuoteBlocker,
  SellQuoteParamsResult,
  toCrossChainErrorCode,
} from "@taostats-wallet/cross-chain"
import { useCallback, useEffect, useState } from "react"

import { getTaoIntents } from "./intents"

/**
 * The sell's quotes, as on the website: the form asks once typing stops (600 ms, the amount only)
 * and refreshes every 30 s while the page is visible and nothing is being reviewed or signed;
 * after a rate limit the refresh backs off to every 2 minutes (the Quoter limits per IP). No retry:
 * the SDK already retries a transient Quoter failure once, and never a 429.
 */

/** Quote after typing stops for this long, never per keystroke. */
export const QUOTE_DEBOUNCE_MS = 600
/** Refresh a shown quote this often. */
export const QUOTE_REFRESH_MS = 30_000
/** A quote holds for about this long (`quote.validUntil`). */
const QUOTE_VALIDITY_MS = 60_000
/** How long a 429 holds off the next automatic refresh. */
const RATE_LIMITED_REFRESH_MS = QUOTE_REFRESH_MS * 4

const IDLE_QUOTE_KEY = ["crossChainSellQuote", "idle"] as const

const refreshDelay = (error: unknown): number =>
  error && toCrossChainErrorCode(error) === "rateLimited"
    ? RATE_LIMITED_REFRESH_MS
    : QUOTE_REFRESH_MS

/** What tells one route from another in a quote key: asset, output and account. */
const routeOf = (key: readonly unknown[] | undefined) =>
  key ? [key[1], key[2], key[4]].map(String).join("|") : undefined

/** `value`, once it has stayed the same for `delayMs`. */
const useDebouncedValue = <T>(value: T, delayMs: number): T => {
  const [debounced, setDebounced] = useState(value)
  // A timer outside React: the value settles after the user stops typing.
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])
  return debounced
}

export type SellQuoteInput = {
  input: SellInput
  output: SellOutput
  /** Dot-decimal amount, as typed. */
  amount: string
  coldkey: string | null | undefined
  recipient: string
}

export type SellQuoteState = {
  /** The quote to show, or `undefined`. */
  quote: Quote | undefined
  /** A quote for what is typed now is on its way (or about to be, once typing stops). */
  isFetching: boolean
  /** `quote` is the previous one of this route, or the last good one after a failed refresh. */
  isStale: boolean
  /** Taken with the placeholder recipient: an estimate. The review takes a firm one. */
  isIndicative: boolean
  /** Why the last request failed. */
  errorCode: CrossChainErrorCode | undefined
  /** Why nothing can be quoted for what is typed. */
  blocker: SellQuoteBlocker | undefined
  /** The params for what is typed now, when it can be quoted. */
  request: Extract<SellQuoteParamsResult, { ok: true }> | undefined
  refetch: () => void
}

/** The form's quote. `paused` stops refreshing (while reviewing or signing); the quote shown stays. */
export const useSellQuote = (
  input: SellQuoteInput,
  { paused, config }: { paused: boolean; config: Parameters<typeof getTaoIntents>[0] },
): SellQuoteState => {
  const debouncedAmount = useDebouncedValue(input.amount, QUOTE_DEBOUNCE_MS)
  const amountPending = debouncedAmount !== input.amount

  const live = buildSellQuoteParams(input)
  const requested = amountPending
    ? buildSellQuoteParams({ ...input, amount: debouncedAmount })
    : live
  // An empty, zero or invalid amount hides the quote at once, without waiting for the debounce.
  const request = live.ok && requested.ok ? requested : undefined
  const enabled = request !== undefined
  const routeKey = routeOf(request?.queryKey)

  const query = useQuery({
    queryKey: request?.queryKey ?? IDLE_QUOTE_KEY,
    queryFn: ({ signal }) => {
      if (!request) throw new Error("No cross-chain quote params")
      return getTaoIntents(config).getQuote(request.params, { signal })
    },
    enabled,
    staleTime: QUOTE_REFRESH_MS,
    gcTime: QUOTE_VALIDITY_MS,
    refetchInterval: (current) => (paused ? false : refreshDelay(current.state.error)),
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: !paused,
    refetchOnReconnect: !paused,
    retry: false,
    // A new amount or recipient keeps the previous quote on screen (dimmed); a new route doesn't.
    placeholderData: (previous, previousQuery) =>
      routeKey !== undefined && routeOf(previousQuery?.queryKey) === routeKey
        ? previous
        : undefined,
  })

  const refetchQuery = query.refetch
  const refetch = useCallback(() => {
    if (enabled) void refetchQuery()
  }, [enabled, refetchQuery])

  const quote = enabled ? query.data : undefined
  return {
    quote,
    isFetching: live.ok && (amountPending || (enabled && query.isFetching)),
    isStale:
      quote !== undefined && (query.isPlaceholderData || amountPending || query.isRefetchError),
    isIndicative: quote !== undefined && request?.isIndicative === true,
    // A failure of the previous amount is not shown while a new one waits.
    errorCode:
      enabled && !amountPending && query.error ? toCrossChainErrorCode(query.error) : undefined,
    blocker: live.ok ? undefined : live.reason,
    request: live.ok && !amountPending ? live : undefined,
    refetch,
  }
}

export type ReviewQuoteState = {
  /** The latest firm quote, `undefined` until the first arrives. */
  quote: Quote | undefined
  isFetching: boolean
  /** Why the last request failed (the last good quote stays in `quote`). */
  errorCode: CrossChainErrorCode | undefined
  /** When the latest quote or failure arrived (ms), 0 before any. */
  updatedAt: number
  /**
   * When the latest quote arrived (ms), 0 before any. A failed refresh doesn't move it, so a moved
   * price waits for a real new quote (`isAwaitingMovedPrice`).
   */
  quoteUpdatedAt: number
  /** When the next refresh runs (ms), for the countdown. */
  refreshAt: number | undefined
  refetch: () => void
}

/**
 * The review's own firm quote: taken when the review opens (never the form's cached one), with
 * exactly the account and recipient that will sign and receive, then refreshed every 30 s until
 * signing starts (`paused`).
 */
export const useSellReviewQuote = (
  request: Extract<SellQuoteParamsResult, { ok: true }> | null,
  { paused, config }: { paused: boolean; config: Parameters<typeof getTaoIntents>[0] },
): ReviewQuoteState => {
  const canQuote = request !== null && !request.isIndicative

  const query = useQuery({
    queryKey: ["crossChainSellReviewQuote", ...(request?.queryKey.slice(1) ?? ["none"])],
    queryFn: ({ signal }) => {
      if (!request) throw new Error("No firm cross-chain quote params")
      return getTaoIntents(config).getQuote(request.params, { signal })
    },
    enabled: canQuote && !paused,
    // A fresh quote on open; then one every 30 s.
    refetchOnMount: "always",
    staleTime: QUOTE_REFRESH_MS,
    gcTime: 0,
    refetchInterval: paused ? false : QUOTE_REFRESH_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: !paused,
    refetchOnReconnect: !paused,
    retry: false,
  })

  const refetchQuery = query.refetch
  const refetch = useCallback(() => {
    if (canQuote) void refetchQuery()
  }, [canQuote, refetchQuery])

  const updatedAt = Math.max(query.dataUpdatedAt, query.errorUpdatedAt)
  return {
    quote: query.data,
    isFetching: query.isFetching,
    errorCode: query.error && !query.isFetching ? toCrossChainErrorCode(query.error) : undefined,
    updatedAt,
    quoteUpdatedAt: query.dataUpdatedAt,
    refreshAt:
      !paused && !query.isFetching && updatedAt > 0 ? updatedAt + QUOTE_REFRESH_MS : undefined,
    refetch,
  }
}
