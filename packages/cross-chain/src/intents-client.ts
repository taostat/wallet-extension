import type { PublicClient } from "viem"
import { DEFAULT_CHAINS, ETHEREUM, SUBTENSOR_EVM, TaoIntents } from "@tao.com/intents-sdk"
import { createPublicClient, defineChain, http } from "viem"
import { mainnet } from "viem/chains"

/**
 * Seconds a solver has to fill an order before it is refunded. The SDK's default, and the
 * website's `FILL_WINDOW_SECONDS`.
 */
export const FILL_WINDOW_SECONDS = 300

/**
 * EVM read timeout. Allows for the API's own upstream timeout (15 s on the website's proxy, which
 * the extension route is expected to share) on top of viem's default 10 s.
 */
export const EVM_RPC_TIMEOUT_MS = 20_000

export type CreateTaoIntentsOptions = {
  /** The extension's `TAOSTATS_API_URL`: `https://taostats.io/api/wallet-extension` in production. */
  apiBaseUrl: string
  /** Default fill window for quotes that don't pin `fillDeadline`. Defaults to `FILL_WINDOW_SECONDS`. */
  fillWindowSeconds?: number
}

/** Our EVM RPC proxy, per chain: `${apiBaseUrl}/evm-rpc/ethereum` and `${apiBaseUrl}/evm-rpc/bittensor`. */
export const getEvmRpcUrls = (apiBaseUrl: string): Record<number, string> => {
  let base: URL
  try {
    base = new URL(apiBaseUrl)
  } catch {
    throw new Error(`Cross-chain: the API base URL is not a URL (${JSON.stringify(apiBaseUrl)}).`)
  }
  if (base.protocol !== "https:" && base.protocol !== "http:")
    throw new Error(`Cross-chain: the API base URL must be http(s), got ${base.protocol}`)
  const root = base.toString().replace(/\/+$/, "")
  return {
    [ETHEREUM]: `${root}/evm-rpc/ethereum`,
    [SUBTENSOR_EVM]: `${root}/evm-rpc/bittensor`,
  }
}

const subtensorEvm = DEFAULT_CHAINS[SUBTENSOR_EVM]

/**
 * viem public clients for Ethereum (1) and Subtensor EVM (964), both through our proxy. The chains'
 * own `rpcUrls` are replaced too, so no public default endpoint is left anywhere a fallback could
 * pick it up. One JSON-RPC request per HTTP request (no batching), like the website.
 */
export const createEvmPublicClients = (rpcUrls: Record<number, string>) => {
  const ethereumUrl = rpcUrls[ETHEREUM]
  const subtensorUrl = rpcUrls[SUBTENSOR_EVM]
  if (!ethereumUrl || !subtensorUrl)
    throw new Error("Cross-chain: an RPC URL is needed for Ethereum and Subtensor EVM.")

  const ethereum = defineChain({ ...mainnet, rpcUrls: { default: { http: [ethereumUrl] } } })
  const subtensor = defineChain({
    id: SUBTENSOR_EVM,
    name: subtensorEvm.name,
    nativeCurrency: subtensorEvm.nativeCurrency,
    rpcUrls: { default: { http: [subtensorUrl] } },
    blockExplorers: { default: { name: "Taostats", url: subtensorEvm.explorerUrl } },
  })

  const clients: Record<number, PublicClient> = {
    [ETHEREUM]: createPublicClient({
      chain: ethereum,
      transport: http(ethereumUrl, { timeout: EVM_RPC_TIMEOUT_MS }),
    }),
    [SUBTENSOR_EVM]: createPublicClient({
      chain: subtensor,
      transport: http(subtensorUrl, { timeout: EVM_RPC_TIMEOUT_MS }),
    }),
  }
  return clients
}

/**
 * A `TaoIntents` client whose EVM reads all go through our server. `publicClients` takes precedence
 * over the SDK's default RPCs; `rpcUrls` is set to the same URLs so the SDK's chain configs carry
 * no public endpoint either. The Quoter (`https://www.tao.com/api/v1/intents/quotes`) is still
 * called directly, as on the website.
 */
export const createTaoIntents = ({
  apiBaseUrl,
  fillWindowSeconds = FILL_WINDOW_SECONDS,
}: CreateTaoIntentsOptions) => {
  const rpcUrls = getEvmRpcUrls(apiBaseUrl)
  return new TaoIntents({
    fillWindowSeconds,
    rpcUrls,
    publicClients: createEvmPublicClients(rpcUrls),
  })
}
