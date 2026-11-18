import {
  BITTENSOR_CHAIN_ID,
  createEvmPublicClients,
  createTaoIntents,
  CrossChainConfig,
} from "@taostats-wallet/cross-chain"

type TaoIntents = ReturnType<typeof createTaoIntents>
type EvmPublicClients = ReturnType<typeof createEvmPublicClients>

let cached: { key: string; intents: TaoIntents } | null = null
let cachedClients: { key: string; clients: EvmPublicClients } | null = null

/**
 * One SDK client per set of EVM RPC URLs (in practice one per UI page): its chain reads, typehash
 * and protocol fee are cached inside it.
 */
export const getTaoIntents = (config: CrossChainConfig): TaoIntents => {
  const key = JSON.stringify(config.evmRpcUrls)
  if (cached?.key !== key) cached = { key, intents: createTaoIntents({ config }) }
  return cached.intents
}

/** A viem client for Subtensor EVM at the config's RPC URL, for the reads the SDK doesn't offer. */
export const getBittensorEvmClient = (config: CrossChainConfig) => {
  const key = JSON.stringify(config.evmRpcUrls)
  if (cachedClients?.key !== key)
    cachedClients = { key, clients: createEvmPublicClients(config.evmRpcUrls) }
  return cachedClients.clients[BITTENSOR_CHAIN_ID]
}
