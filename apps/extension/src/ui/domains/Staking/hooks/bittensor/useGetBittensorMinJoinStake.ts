import { useQuery } from "@tanstack/react-query"
import { DotNetworkId } from "@taostats-wallet/chaindata-provider"

import { useScaleApi } from "@ui/hooks/sapi/useScaleApi"

type GetBittensorMinJoinStake = {
  networkId: DotNetworkId | null | undefined
}

export const useGetBittensorMinJoinStake = ({ networkId }: GetBittensorMinJoinStake) => {
  const { data: sapi } = useScaleApi(networkId)

  return useQuery({
    queryKey: ["useGetBittensorMinJoinStake", sapi?.id],
    queryFn: async () => {
      if (!sapi) return null

      // same for all netuids
      // also must not go below this minimum when unstaking partially
      return sapi.getStorage<bigint>("SubtensorModule", "NominatorMinRequiredStake", [])
    },
    enabled: !!sapi,
  })
}
