import { DotNetworkId } from "@taostats-wallet/chaindata-provider"
import { ScaleApi } from "@taostats-wallet/sapi"

import { useBittensorCurrentHotkey } from "../../hooks/bittensor/useGetBittensorStakeHotkeys"
import { useGetFeeEstimate } from "../../shared/useGetFeeEstimate"
import { type StakeDirection } from "./useBittensorStakeWizard"
import { useBittensorStakingPayload } from "./useBittensorStakingPayload"

type GetStakeInfo = {
  sapi: ScaleApi | undefined | null
  address: string | null
  hotkey: string | null | undefined
  netuid: number | null
  amountIn: bigint | null
  networkId: DotNetworkId | undefined
  stakeDirection: StakeDirection
}

export const useGetBittensorStakeInfo = ({
  sapi,
  address,
  hotkey,
  netuid,
  amountIn,
  networkId,
  stakeDirection,
}: GetStakeInfo) => {
  const {
    alphaPrice,
    payload,
    feeEstimatePayload,
    txMetadata,
    minTaoStake,
    minAlphaStake,
    minAlphaUnstake,
    amountOut,
    taostatsFee,
    errorPayload,
    swapPrice,
    priceImpact,
    isLoading: isLoadingPayload,
    slippage,
  } = useBittensorStakingPayload({
    netuid,
    amountIn,
    direction: stakeDirection === "stake" ? "taoToAlpha" : "alphaToTao",
    hotkey,
    address,
    networkId,
  })

  const currentHotkey = useBittensorCurrentHotkey({ address, networkId, netuid })

  const {
    data: feeEstimate,
    isLoading: isLoadingFeeEstimate,
    error: errorFeeEstimate,
  } = useGetFeeEstimate({ sapi, payload: feeEstimatePayload })

  return {
    alphaPrice,
    swapPrice,
    payload,
    txMetadata,
    isLoadingPayload,
    errorPayload,
    feeEstimate,
    isLoadingFeeEstimate,
    errorFeeEstimate,
    currentHotkey,
    minTaoStake,
    minAlphaStake,
    minAlphaUnstake,
    priceImpact,
    taostatsFee,
    amountOut,
    slippage,
  }
}
