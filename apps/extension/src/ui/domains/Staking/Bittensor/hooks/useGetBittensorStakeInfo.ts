import { DotNetworkId } from "@taostats-wallet/chaindata-provider"
import { ScaleApi } from "@taostats-wallet/sapi"

import { useBittensorCurrentHotkey } from "../../hooks/bittensor/useGetBittensorStakeHotkeys"
import { useBittensorInclusionFee } from "./useBittensorInclusionFee"
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
  /** When true, payload includes MevShield server fee transfer (Taostats Shield). */
  forTaostatsShield?: boolean
  /** When false, skip the fee RPC. The entry form never prices a fee. */
  estimateFee?: boolean
}

export const useGetBittensorStakeInfo = ({
  sapi,
  address,
  hotkey,
  netuid,
  amountIn,
  networkId,
  stakeDirection,
  forTaostatsShield,
  estimateFee = false,
}: GetStakeInfo) => {
  const direction = stakeDirection === "stake" ? "taoToAlpha" : "alphaToTao"

  const {
    alphaPrice,
    minJoinTaoStake,
    minAlphaStake,
    minTaoStake,
    minAlphaUnstake,
    amountOut,
    taostatsFee,
    swapPrice,
    priceImpact,
    isLoading: isLoadingPayload,
    isQuoteReady,
    quoteError,
    prepareSignerPayload,
    slippage,
  } = useBittensorStakingPayload({
    netuid,
    amountIn,
    direction,
    hotkey,
    address,
    networkId,
    forTaostatsShield,
  })

  const currentHotkey = useBittensorCurrentHotkey({ address, networkId, netuid })

  const {
    data: feeEstimate,
    isLoading: isLoadingFeeEstimate,
    error: errorFeeEstimate,
  } = useBittensorInclusionFee({
    sapi,
    address,
    hotkey,
    netuid,
    networkId,
    direction,
    forTaostatsShield,
    hasTaostatsFee: (taostatsFee ?? 0n) > 0n,
    enabled: estimateFee,
  })

  return {
    alphaPrice,
    swapPrice,
    isLoadingPayload,
    isQuoteReady,
    quoteError,
    prepareSignerPayload,
    feeEstimate,
    isLoadingFeeEstimate,
    errorFeeEstimate,
    currentHotkey,
    minJoinTaoStake,
    minAlphaStake,
    minTaoStake,
    minAlphaUnstake,
    priceImpact,
    taostatsFee,
    amountOut,
    slippage,
  }
}
