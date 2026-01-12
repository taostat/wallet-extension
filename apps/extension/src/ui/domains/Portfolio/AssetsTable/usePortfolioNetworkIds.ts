import { Balances } from "@taostats-wallet/balances"
import { NetworkId } from "@taostats-wallet/chaindata-provider"
import { isNotNil } from "@taostats-wallet/util"
import { useMemo } from "react"

export const usePortfolioNetworkIds = (balances: Balances) => {
  return useMemo<NetworkId[]>(
    () =>
      [...new Set(balances.each.filter((b) => b.total.planck > 0).map((b) => b.networkId))].filter(
        isNotNil,
      ),
    [balances],
  )
}
