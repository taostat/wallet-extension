import { createTaoIntents, CrossChainConfig } from "@taostats-wallet/cross-chain"

type TaoIntents = ReturnType<typeof createTaoIntents>

let cached: { key: string; intents: TaoIntents } | null = null

/**
 * One SDK client per set of EVM RPC URLs (in practice one per UI page): its chain reads, typehash
 * and protocol fee are cached inside it.
 */
export const getTaoIntents = (config: CrossChainConfig): TaoIntents => {
  const key = JSON.stringify(config.evmRpcUrls)
  if (cached?.key !== key) cached = { key, intents: createTaoIntents({ config }) }
  return cached.intents
}
