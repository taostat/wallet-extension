import type { WatchOptions } from "@tao.com/intents-sdk"
import type { PublicClient } from "viem"
import { DEFAULT_CHAINS, ETHEREUM, SUBTENSOR_EVM, TaoIntents } from "@tao.com/intents-sdk"
import { createPublicClient, defineChain, http } from "viem"
import { mainnet } from "viem/chains"

import type { CrossChainConfig, EvmRpcUrls } from "./config"
import { crossChainUrlProblem } from "./config"

/**
 * Seconds a solver has to fill an order before it is refunded. The SDK's default, and the
 * website's `FILL_WINDOW_SECONDS`.
 */
export const FILL_WINDOW_SECONDS = 300

/**
 * Our partner code with TAO.com: `execute`'s `partnerId`, an ERC-8021 attribution suffix on
 * `open`. Public: it is written into every order's calldata.
 */
export const INTENTS_PARTNER_ID = "c36059"

/** EVM read timeout: viem's default 10 s. The RPCs are called directly, with no proxy in between. */
export const EVM_RPC_TIMEOUT_MS = 10_000

/**
 * One retry, a second later, instead of viem's three within a second: keyless Blockmachine allows
 * 60 request units a minute per IP, and quick retries of a 429 only keep the user throttled.
 */
const EVM_RPC_TRANSPORT = { timeout: EVM_RPC_TIMEOUT_MS, retryCount: 1, retryDelay: 1_000 }

export type CreateTaoIntentsOptions = {
  /** From `fetchCrossChainConfig` (or `DEFAULT_CROSS_CHAIN_CONFIG`). Only `evmRpcUrls` is used here. */
  config: CrossChainConfig
  /** Default fill window for quotes that don't pin `fillDeadline`. Defaults to `FILL_WINDOW_SECONDS`. */
  fillWindowSeconds?: number
}

/** The config's RPC URLs by chain id, checked again in case the config was built by hand. */
const rpcUrlsByChainId = (evmRpcUrls: EvmRpcUrls): Record<number, string> => {
  const rpcUrls: Record<number, string> = {
    [ETHEREUM]: evmRpcUrls.ethereum,
    [SUBTENSOR_EVM]: evmRpcUrls.bittensor,
  }
  for (const [chainId, url] of Object.entries(rpcUrls)) {
    const problem = typeof url === "string" ? crossChainUrlProblem(url) : "missing"
    if (problem !== null)
      throw new Error(`Cross-chain: the RPC URL for chain ${chainId} is unusable: ${problem}`)
  }
  return rpcUrls
}

const subtensorEvm = DEFAULT_CHAINS[SUBTENSOR_EVM]

/**
 * viem public clients for Ethereum (1) and Subtensor EVM (964), at the config's RPC URLs. The
 * chains' own `rpcUrls` are replaced too, so no public default endpoint is left anywhere a fallback
 * could pick it up. One JSON-RPC request per HTTP request (no batching), like the website.
 */
export const createEvmPublicClients = (evmRpcUrls: EvmRpcUrls) => {
  const { [ETHEREUM]: ethereumUrl, [SUBTENSOR_EVM]: subtensorUrl } = rpcUrlsByChainId(evmRpcUrls)

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
      transport: http(ethereumUrl, EVM_RPC_TRANSPORT),
    }),
    [SUBTENSOR_EVM]: createPublicClient({
      chain: subtensor,
      transport: http(subtensorUrl, EVM_RPC_TRANSPORT),
    }),
  }
  return clients
}

/**
 * A `TaoIntents` client whose EVM reads all go to the config's RPC URLs. `publicClients` takes
 * precedence over the SDK's default RPCs; `rpcUrls` is set to the same URLs so the SDK's chain
 * configs carry no public default either. The Quoter (`https://www.tao.com/api/v1/intents/quotes`)
 * is called directly, as on the website.
 */
export const createTaoIntents = ({
  config,
  fillWindowSeconds = FILL_WINDOW_SECONDS,
}: CreateTaoIntentsOptions) =>
  new TaoIntents({
    fillWindowSeconds,
    rpcUrls: rpcUrlsByChainId(config.evmRpcUrls),
    publicClients: createEvmPublicClients(config.evmRpcUrls),
  })

/**
 * Options for tracking an order (`order.watch` / `order.waitForSettlement`): polls at the config's
 * `orderPollIntervalMs` instead of the SDK's 5 s. Each check is two reads.
 */
export const orderWatchOptions = (config: CrossChainConfig): WatchOptions => ({
  pollIntervalMs: config.orderPollIntervalMs,
})
