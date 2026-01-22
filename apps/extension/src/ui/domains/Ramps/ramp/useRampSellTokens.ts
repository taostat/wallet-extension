import { Token } from "@taostats-wallet/chaindata-provider"
import { isNotNil } from "@taostats-wallet/util"
import { useMemo } from "react"

import { useRemoteConfig, useTokensMap } from "@ui/state"

import { getTokenFromRampAsset } from "../shared/helpers"
import { useRampTokens } from "./useRampTokens"

export const useRampSellTokens = (currency: string | undefined) => {
  const remoteConfig = useRemoteConfig()
  const tokenMap = useTokensMap({ activeOnly: false, includeTestnets: false })

  const { data, isLoading, error } = useRampTokens(currency, "sell")

  const tokens = useMemo<Token[] | undefined>(() => {
    return data?.assets
      .map((asset) => getTokenFromRampAsset(asset, remoteConfig, tokenMap))
      .filter(isNotNil)
  }, [data?.assets, remoteConfig, tokenMap])

  return { tokens, isLoading, error }
}
