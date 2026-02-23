import { Balance, Balances } from "@taostats-wallet/balances"
import { NetworkId, subNativeTokenId, TokenId } from "@taostats-wallet/chaindata-provider"
import { isNotNil } from "@taostats-wallet/util"
import { Address, RemoteConfigStoreData } from "extension-core"
import { MouseEventHandler, useCallback, useMemo } from "react"

import { useAnalytics } from "@ui/hooks/useAnalytics"
import { useAccounts, useBalances, useRemoteConfig } from "@ui/state"
import { useBittensorNetworkIds } from "@ui/state/bittensor"

import { useBittensorBondModal } from "../../Bittensor/hooks/useBittensorBondModal"
import { useStakeModal } from "./useStakeModal"

export const useStakeButton = ({
  balances,
  ignoreExistingSettings,
}: {
  balances: Balances | null | undefined
  // for now only used for bittensor to prevent reusing existing netuid
  ignoreExistingSettings?: boolean
}) => {
  const { genericEvent } = useAnalytics()
  const ownedAccounts = useAccounts("owned")

  const remoteConfig = useRemoteConfig()
  const { open } = useStakeModal()
  const { open: handleOpenBittensorModal } = useBittensorBondModal()
  const bittensorNetworkIds = useBittensorNetworkIds()
  const allBalances = useBalances("owned")

  const ownedAddresses = useMemo(() => ownedAccounts.map(({ address }) => address), [ownedAccounts])

  const [bestStakeableBalance, isStaking] = useMemo<[StakeableBalance | null, boolean]>(() => {
    if (!balances?.each) return [null, false]

    const stakeableBalances = balances.each
      .filter((b) => ownedAddresses.includes(b.address))
      .map((b) => getStakeableBalance(b, remoteConfig, bittensorNetworkIds, allBalances))
      .filter(isNotNil)
      .sort((a, b) => (a.amount === b.amount ? 0 : a.amount > b.amount ? -1 : 1))

    return [
      stakeableBalances.length ? stakeableBalances[0] : null,
      stakeableBalances.some((b) => b.isStaking),
    ]
  }, [allBalances, balances, bittensorNetworkIds, ownedAddresses, remoteConfig])

  const handleClick: MouseEventHandler<HTMLButtonElement> = useCallback(
    (e) => {
      if (!bestStakeableBalance) return
      e.stopPropagation()

      genericEvent("open inline staking modal", {
        tokenId: bestStakeableBalance.tokenId,
        from: "portfolio",
      })

      switch (bestStakeableBalance.type) {
        case "bittensor": {
          const { address, networkId, hotkey, netuid } = bestStakeableBalance
          handleOpenBittensorModal({
            stakeDirection: "bond",
            address,
            networkId,
            hotkey,
            netuid: ignoreExistingSettings ? undefined : netuid,
          })
          break
        }
        case "nominationPool": {
          const { address, tokenId, poolId } = bestStakeableBalance
          open({ address, tokenId, poolId })
          break
        }
      }
    },
    [bestStakeableBalance, genericEvent, handleOpenBittensorModal, ignoreExistingSettings, open],
  )

  return {
    canStake: !!bestStakeableBalance,
    onClick: bestStakeableBalance ? handleClick : null,
    isStaking,
  }
}

type StakeableBalance =
  | {
      type: "bittensor"
      networkId: NetworkId
      tokenId: TokenId
      address: Address
      amount: bigint
      hotkey?: string
      netuid?: number
      isStaking: boolean
    }
  | {
      type: "nominationPool"
      tokenId: TokenId
      address: Address
      amount: bigint
      poolId: number
      isStaking: boolean
    }

const getStakeableBalance = (
  balance: Balance,
  remoteConfig: RemoteConfigStoreData,
  bittensorNetworkIds: string[],
  allBalances: Balances,
): StakeableBalance | null => {
  const token = balance.token
  if (!token) return null

  /**
   * Bittensor Staking
   */
  if (token?.type === "substrate-native" && bittensorNetworkIds.includes(token.networkId)) {
    const defaultHotkey = remoteConfig.stakingPools["bittensor"]?.[0] as string | undefined

    const isStaking = allBalances.each.some(
      (b) =>
        b.networkId === token.networkId &&
        b.token?.type === "substrate-dtao" &&
        b.address === balance.address &&
        b.free.planck > 0n,
    )

    return {
      type: "bittensor",
      networkId: token.networkId,
      tokenId: subNativeTokenId(token.networkId), // only for analytics
      address: balance.address,
      hotkey: defaultHotkey,
      amount: balance.transferable.planck,
      isStaking,
    }
  }

  // if dTAO, assume we can stake more native TAO
  if (token.type === "substrate-dtao" && bittensorNetworkIds.includes(token.networkId)) {
    const address = balance.address
    return {
      type: "bittensor",
      networkId: token.networkId,
      tokenId: subNativeTokenId(token.networkId), // only for analytics
      address,
      hotkey: token.hotkey,
      netuid: token.netuid,
      amount: balance?.transferable.planck ?? 0n, // used only for sorting
      isStaking: true,
    }
  }

  /**
   * Nomination Pool Staking
   */
  if (
    token?.type === "substrate-native" &&
    !!remoteConfig.nominationPools[token.networkId]?.length
  ) {
    const defaultPoolId = remoteConfig.nominationPools[token.networkId][0]

    // cant stake in nom pools if solo staking
    type SoloStakingMeta = { id?: string } | undefined
    if (balance.locks.some((l) => (l.meta as SoloStakingMeta)?.id === "staking "))
      // the space is intentional
      return null

    // if already staking in a pool, reuse that poolId
    type NomPoolMeta = { poolId?: number } | undefined
    const entry = balance.nompools.find((b) => !!(b.meta as NomPoolMeta)?.poolId)
    const meta = entry?.meta as NomPoolMeta

    return {
      type: "nominationPool",
      tokenId: token.id,
      address: balance.address,
      poolId: meta?.poolId ?? defaultPoolId,
      amount: balance.transferable.planck,
      isStaking: !!meta,
    }
  }

  return null
}
