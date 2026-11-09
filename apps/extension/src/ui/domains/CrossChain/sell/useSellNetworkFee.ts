import { HexString } from "@polkadot/util/types"
import { useQuery } from "@tanstack/react-query"
import {
  CrossChainConfig,
  estimateSellBatchFee,
  INTENTS_PARTNER_ID,
  Quote,
  SellQuoteKey,
  swapSlippageFor,
} from "@taostats-wallet/cross-chain"

import { useScaleApi } from "@ui/hooks/sapi/useScaleApi"

import { getTaoIntents } from "./intents"

/**
 * The network fee (rao) of the batch this review would sign, priced once per review with sapi on
 * the batch the SDK builds (`estimateSellBatchFee`: nothing is signed or sent). `null` while
 * unknown, or when it couldn't be priced. Each estimate makes a few EVM reads, so it isn't
 * refreshed with the quote: the fee doesn't follow the price.
 */
export const useSellNetworkFee = ({
  config,
  genesisHash,
  address,
  quote,
  requestKey,
  slippageBps,
  enabled,
}: {
  config: CrossChainConfig
  genesisHash: HexString | null | undefined
  address: string | null | undefined
  /** The review's firm quote. */
  quote: Quote | undefined
  /** The review's request: a new one is a new estimate. */
  requestKey: SellQuoteKey | undefined
  slippageBps: number
  enabled: boolean
}) => {
  const { data: sapi } = useScaleApi(genesisHash)

  return useQuery({
    queryKey: ["crossChainSellNetworkFee", ...(requestKey?.slice(1) ?? ["none"]), slippageBps],
    queryFn: async ({ signal }) => {
      if (!sapi || !quote || !address) return null
      const fee = await estimateSellBatchFee({
        intents: getTaoIntents(config),
        quote,
        address,
        sapi,
        swapSlippageBps: swapSlippageFor(slippageBps),
        partnerId: INTENTS_PARTNER_ID,
        signal,
      })
      return fee ?? null
    },
    enabled: enabled && !!sapi && !!quote && !!address && !!requestKey,
    staleTime: Infinity,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}
