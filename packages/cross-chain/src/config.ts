import z from "zod/v4"

/**
 * Cross-chain settings our API serves at `GET ${TAOSTATS_API_URL}/cross-chain/config`, so they can
 * change without shipping a new extension:
 *
 * - `enabled`: follows the website's cross-chain flag; our kill switch;
 * - `evmRpcUrls`: where the SDK's EVM reads go, read straight from the browser (keyless
 *   Blockmachine by default: 60 request units a minute per IP, so each user spends their own limit);
 * - `orderPollIntervalMs`: how often order tracking checks an order (two reads per check), slower
 *   than the SDK's 5 s so one user stays under the per-IP limit with two open orders.
 */

/** EVM JSON-RPC endpoints: Ethereum (chain 1) and Subtensor EVM (chain 964). */
export type EvmRpcUrls = {
  readonly ethereum: string
  readonly bittensor: string
}

export type CrossChainConfig = {
  readonly enabled: boolean
  readonly evmRpcUrls: EvmRpcUrls
  readonly orderPollIntervalMs: number
}

/** The built-in values, used whenever our API's can't be had. */
export const DEFAULT_CROSS_CHAIN_CONFIG: CrossChainConfig = Object.freeze({
  enabled: true,
  evmRpcUrls: Object.freeze({
    ethereum: "https://rpc-eth.blockmachine.io",
    // The same URL serves Substrate and the Subtensor EVM.
    bittensor: "https://rpc.blockmachine.io",
  }),
  orderPollIntervalMs: 10_000,
})

/** The defaults, switched off: what an invalid body that still says `enabled: false` gives. */
const KILLED_DEFAULT_CONFIG: CrossChainConfig = Object.freeze({
  ...DEFAULT_CROSS_CHAIN_CONFIG,
  enabled: false,
})

/** How long `fetchCrossChainConfig` waits before using the defaults. */
export const CROSS_CHAIN_CONFIG_TIMEOUT_MS = 5_000

const MIN_ORDER_POLL_INTERVAL_MS = 5_000
const MAX_ORDER_POLL_INTERVAL_MS = 60_000

/** Hosts plain `http:` is allowed to, for local development. */
const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1"])

/**
 * Why `text` can't be used as a cross-chain endpoint (our API or an EVM RPC), or `null` when it
 * can: it must be an absolute `https:` URL, or `http:` to `localhost` / `127.0.0.1`, and carry no
 * credentials.
 */
export function crossChainUrlProblem(text: string): string | null {
  let url: URL
  try {
    url = new URL(text)
  } catch {
    return "not a URL"
  }
  if (url.username || url.password) return "must not carry credentials"
  if (url.protocol === "https:") return null
  if (url.protocol === "http:")
    return LOCAL_HOSTNAMES.has(url.hostname)
      ? null
      : `http: is only allowed to localhost or 127.0.0.1, got ${url.hostname}`
  return `must be https:, got ${url.protocol}`
}

const EndpointUrlSchema = z.string().superRefine((value, ctx) => {
  const problem = crossChainUrlProblem(value)
  if (problem !== null) ctx.addIssue({ code: "custom", message: problem })
})

// `z.object` drops unknown keys, so the server can add fields without breaking older extensions.
const CrossChainConfigSchema = z.object({
  enabled: z.boolean(),
  evmRpcUrls: z.object({ ethereum: EndpointUrlSchema, bittensor: EndpointUrlSchema }),
  orderPollIntervalMs: z
    .number()
    .int()
    .min(MIN_ORDER_POLL_INTERVAL_MS)
    .max(MAX_ORDER_POLL_INTERVAL_MS),
})

export type ParseCrossChainConfigResult =
  | { ok: true; config: CrossChainConfig }
  | { ok: false; problem: string }

/**
 * Validates a config body: every field present; both RPC URLs `https:` (or `http:` to localhost /
 * 127.0.0.1); `orderPollIntervalMs` an integer from 5 000 to 60 000. Unknown fields are dropped.
 */
export function parseCrossChainConfig(json: unknown): ParseCrossChainConfigResult {
  const result = CrossChainConfigSchema.safeParse(json)
  if (result.success) return { ok: true, config: result.data }
  const problem = result.error.issues
    .map((issue) =>
      issue.path.length ? `${issue.path.map(String).join(".")}: ${issue.message}` : issue.message,
    )
    .join("; ")
  return { ok: false, problem }
}

export type CrossChainConfigResult =
  /** Our API's config. */
  | { config: CrossChainConfig; source: "server"; problem?: undefined }
  /** `DEFAULT_CROSS_CHAIN_CONFIG`, and why our API's couldn't be used. */
  | { config: CrossChainConfig; source: "default"; problem: string }

export type FetchCrossChainConfigOptions = {
  /** Custom `fetch` (defaults to the global one). */
  fetch?: typeof fetch
  /** Use the defaults after this long. Default `CROSS_CHAIN_CONFIG_TIMEOUT_MS` (5 s). */
  timeoutMs?: number
}

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error))

/**
 * Our API's cross-chain config, from `${apiBaseUrl}/cross-chain/config`. Never throws: on any
 * failure (bad base URL, network error, timeout, non-2xx, a body that isn't JSON or doesn't
 * validate) it returns `DEFAULT_CROSS_CHAIN_CONFIG` with `source: "default"` and the `problem`, for
 * the caller to log.
 *
 * A failed fetch therefore leaves cross-chain **enabled**: the kill switch works whenever our API
 * answers, and our API is already a dependency for the wallet's chain data. An answer that says
 * `enabled: false` is obeyed even if the rest of it doesn't validate (the defaults, switched off).
 *
 * The request is a simple GET (no custom headers, no `Content-Type`), so a browser never sends a
 * CORS preflight, and it sends no cookies (`credentials: "omit"`).
 */
export async function fetchCrossChainConfig(
  apiBaseUrl: string,
  {
    fetch: fetchFn = globalThis.fetch,
    timeoutMs = CROSS_CHAIN_CONFIG_TIMEOUT_MS,
  }: FetchCrossChainConfigOptions = {},
): Promise<CrossChainConfigResult> {
  const fallback = (problem: string): CrossChainConfigResult => ({
    config: DEFAULT_CROSS_CHAIN_CONFIG,
    source: "default",
    problem,
  })

  const baseProblem = crossChainUrlProblem(apiBaseUrl)
  if (baseProblem !== null) return fallback(`the API base URL is unusable: ${baseProblem}`)
  const url = `${apiBaseUrl.replace(/\/+$/, "")}/cross-chain/config`

  const controller = new AbortController()

  const load = async (): Promise<CrossChainConfigResult> => {
    let response: Response
    try {
      response = await fetchFn(url, {
        method: "GET",
        credentials: "omit",
        signal: controller.signal,
      })
    } catch (error) {
      return fallback(`the request failed: ${errorMessage(error)}`)
    }
    if (!response.ok) return fallback(`the API answered HTTP ${response.status}`)
    let json: unknown
    try {
      json = await response.json()
    } catch {
      return fallback("the response is not JSON")
    }
    const parsed = parseCrossChainConfig(json)
    if (parsed.ok) return { config: parsed.config, source: "server" }
    // An explicit kill holds even when the rest of the body is unusable: the defaults, switched off.
    const isKilled =
      typeof json === "object" && json !== null && (json as { enabled?: unknown }).enabled === false
    const problem = `the config is invalid: ${parsed.problem}`
    return isKilled
      ? { config: KILLED_DEFAULT_CONFIG, source: "default", problem }
      : fallback(problem)
  }

  // Raced rather than left to the abort signal, so a `fetch` that ignores it still times out.
  let timer: ReturnType<typeof setTimeout> | undefined
  const timedOut = new Promise<CrossChainConfigResult>((resolve) => {
    timer = setTimeout(() => {
      resolve(fallback(`no answer within ${timeoutMs} ms`))
      controller.abort()
    }, timeoutMs)
  })

  try {
    return await Promise.race([load(), timedOut])
  } catch (error) {
    return fallback(errorMessage(error))
  } finally {
    clearTimeout(timer)
  }
}

// The SDK-free entry (`@taostats-wallet/cross-chain/config`) also carries what the pages' first
// load needs to know about saved sells (their store, the trackers' host, the "needs attention"
// notice) and the analytics events: no SDK or viem at runtime in any of them.
export * from "./sell-records"
export * from "./sell-records-store"
export * from "./analytics"
