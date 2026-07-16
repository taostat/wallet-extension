import { DotNetworkId } from "@taostats-wallet/chaindata-provider"

import { useNomPoolName } from "../hooks/nomPools/useNomPoolName"

type NominationPoolNameProps = {
  poolId: string | number | undefined | null
  chainId: DotNetworkId | undefined
}

export const NominationPoolName = ({ chainId, poolId }: NominationPoolNameProps) => {
  const { data: poolName, isLoading, isError } = useNomPoolName(chainId, poolId)

  const defaultPoolName = "Taostats Pool"

  if (isLoading)
    return (
      <div className={"text-fg-disabled bg-tertiary rounded-xs h-[16px] w-20 animate-pulse"} />
    )

  if (isError || !poolName) return <>{defaultPoolName}</>

  return <>{poolName}</>
}
