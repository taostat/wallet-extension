import { useQuery } from "@tanstack/react-query"
import { DotNetworkId } from "@taostats-wallet/chaindata-provider"

import { useScaleApi } from "@ui/hooks/sapi/useScaleApi"

import { getSwapSimulation } from "../utils/helpers"
import { StakeDirection } from "./types"

type UseBittensorSimulateSwapInputs = {
  networkId: DotNetworkId
  direction: StakeDirection
  netuid: number | null | undefined
  amountIn: bigint | null | undefined
}

export const useBittensorSimulateSwap = ({
  networkId,
  direction,
  netuid,
  amountIn,
}: UseBittensorSimulateSwapInputs) => {
  const { data: sapi } = useScaleApi(networkId)

  return useQuery({
    queryKey: ["useBittensorSimulateSwap", sapi?.id, direction, netuid, amountIn?.toString()],
    queryFn: async () => {
      if (!sapi || typeof amountIn !== "bigint" || typeof netuid !== "number") return null
      return getSwapSimulation(sapi, netuid, direction, amountIn)
    },
    refetchInterval: 12_000, // refresh for pool/mempool changes without saturating RPC rate limits
  })
}
