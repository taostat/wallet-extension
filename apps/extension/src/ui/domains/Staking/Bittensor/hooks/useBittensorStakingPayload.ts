import { useQuery } from "@tanstack/react-query"
import { taoToAlpha } from "@taostats-wallet/balances"
import { ScaleApi } from "@taostats-wallet/sapi"
import { useMemo } from "react"

import { useScaleApi } from "@ui/hooks/sapi/useScaleApi"

import { useGetBittensorMinJoinStake } from "../../hooks/bittensor/useGetBittensorMinJoinStake"
import { useGetBittensorDefaultMinStake } from "../../hooks/bittensor/useGetBittensorMinStake"
import { useGetFeeEstimate } from "../../shared/useGetFeeEstimate"
import {
  getBittensorStakingPayload,
  getBittensorUnstakePayload,
  getLimitPrice,
} from "../utils/helpers"
import { MEVSHIELD_SERVER_FEE_RAO } from "../utils/constants"
import { StakeDirection } from "./types"
import { useBittensorAlphaPrice } from "./useBittensorAlphaPrice"
import { useBittensorSimulateSwap } from "./useBittensorSimulateSwap"
import { useBittensorSubnetSlippage } from "./useBittensorSubnetSlippage"
import { useGetSubnetFee } from "./useGetSubnetFee"

type UseBittensorStakingPayloadProps = {
  address: string | null
  hotkey: string | null | undefined
  networkId: string | undefined
  netuid: number | null
  amountIn: bigint | null
  direction: StakeDirection
  /** When true, batch includes transfer to MevShield server fee wallet (Taostats Shield). */
  forTaostatsShield?: boolean
}

const MOCKED_HOTKEY = "5HK5tp6t2S59DywmHRWPBVJeJ86T61KjurYqeooqj8sREpeN"

export const useBittensorStakingPayload = ({
  networkId,
  address,
  hotkey,
  netuid,
  direction,
  amountIn,
  forTaostatsShield,
}: UseBittensorStakingPayloadProps) => {
  const subnetFee = useGetSubnetFee({ netuid: netuid ?? 0, direction })
  const [slippage] = useBittensorSubnetSlippage(netuid)

  const { data: sapi, isLoading: isLoadingSapi, isError: isErrorSapi } = useScaleApi(networkId)

  const {
    data: minJoinTaoStake,
    isLoading: isLoadingMinJoinTaoStake,
    isError: isErrorMinJoinTaoStake,
  } = useGetBittensorMinJoinStake({ networkId })

  const {
    data: alphaPrice,
    isLoading: isLoadingAlphaPrice,
    isError: isErrorAlphaPrice,
  } = useBittensorAlphaPrice({ networkId, netuid })

  // an partial unstake operation will fail if the remaining stake is less than the alpha equivalent of minTaoStake
  const minAlphaStake = useMemo(() => {
    if (typeof minJoinTaoStake !== "bigint" || typeof alphaPrice !== "bigint") return null
    return taoToAlpha(minJoinTaoStake, alphaPrice)
  }, [minJoinTaoStake, alphaPrice])

  const minTaoStake = useGetBittensorDefaultMinStake({ networkId })

  const minAlphaUnstake = useMemo(() => {
    if (typeof minTaoStake !== "bigint" || typeof alphaPrice !== "bigint") return null
    return taoToAlpha(minTaoStake, alphaPrice)
  }, [minTaoStake, alphaPrice])

  // amount to be swapped. in case of taoToAlpha on a subnet, we need to subtract the taostats fee first or it will invalidate the simulation.
  const amount = useMemo(() => {
    if (typeof netuid !== "number" || typeof amountIn !== "bigint") return null
    if (netuid === 0) return amountIn

    switch (direction) {
      case "taoToAlpha": {
        const appStakingFee = calculateFee({
          amount: amountIn,
          fee: subnetFee,
        })
        return amountIn - appStakingFee
      }
      case "alphaToTao":
        return amountIn
    }
  }, [amountIn, direction, netuid, subnetFee])

  const {
    data: simulation,
    isLoading: isLoadingSimulation,
    isError: isErrorSimulation,
  } = useBittensorSimulateSwap({
    networkId: "bittensor",
    direction,
    netuid,
    amountIn: amount,
  })

  // price that we will pay if no slippage occurs
  const swapPrice = useMemo(() => {
    if (!simulation) return null
    return getLimitPrice(simulation, direction, 0)
  }, [simulation, direction])

  const priceLimit = useMemo(() => {
    if (!simulation) return null
    const tolerance = slippage / 100 // percentage to decimal
    return getLimitPrice(simulation, direction, tolerance)
  }, [simulation, direction, slippage])

  const priceImpact = useMemo(() => {
    if (!alphaPrice || !swapPrice) return null
    const scaleFactor = 10_000n // to get 4 decimal places
    const diff = swapPrice - alphaPrice // bigint
    const scaledPriceImpact = (diff * scaleFactor) / alphaPrice
    return Number(scaledPriceImpact) / 100
  }, [alphaPrice, swapPrice])

  const taostatsFee = useMemo(() => {
    if (typeof amountIn !== "bigint" || !simulation) return null
    // WARNING: because of slippage it would make more sense to send alpha instead of tao when unstaking
    return calculateFee({
      amount: direction === "taoToAlpha" ? amountIn : simulation?.tao_amount,
      fee: subnetFee,
    })
  }, [amountIn, direction, simulation, subnetFee])

  const amountOut = useMemo(() => {
    if (!simulation || typeof taostatsFee !== "bigint") return 0n // TODO should be null

    switch (direction) {
      case "taoToAlpha":
        return simulation.alpha_amount
      case "alphaToTao":
        return simulation.tao_amount - taostatsFee
    }
  }, [direction, simulation, taostatsFee])

  // When Taostats Shield: get fee of payload without server transfer, then server fee = that + 5%
  const {
    data: basePayloadForServerFee,
    isLoading: isLoadingBasePayloadForServerFee,
  } = useBittensorAnyStakingPayload({
    sapi,
    direction,
    address,
    netuid,
    hotkey: hotkey ?? MOCKED_HOTKEY,
    amount: amount ?? minJoinTaoStake,
    priceLimit: priceLimit ?? 1_000n,
    taostatsFee: taostatsFee ?? 1_000n,
    serverFeeForShieldRao: undefined,
    enabled: !!forTaostatsShield && !!sapi && !!address && !!hotkey && typeof netuid === "number",
  })

  const {
    data: baseFeeEstimateRao,
    isLoading: isLoadingBaseFeeEstimate,
  } = useGetFeeEstimate({
    sapi,
    payload: forTaostatsShield ? basePayloadForServerFee?.payload : undefined,
  })

  const serverFeeForShieldRao = useMemo(() => {
    if (!forTaostatsShield) return undefined
    if (baseFeeEstimateRao != null)
      return baseFeeEstimateRao + (baseFeeEstimateRao * 5n) / 100n
    return MEVSHIELD_SERVER_FEE_RAO
  }, [forTaostatsShield, baseFeeEstimateRao])

  const {
    data: swapPayload,
    isLoading: isLoadingPayload,
    isError: isErrorPayload,
    error: errorPayload,
  } = useBittensorAnyStakingPayload({
    sapi,
    direction,
    address,
    netuid,
    hotkey,
    amount,
    priceLimit,
    taostatsFee,
    serverFeeForShieldRao,
  })

  const {
    data: feeEstimatePayload,
    isLoading: isLoadingFeeEstimatePayload,
    isError: isErrorFeeEstimatePayload,
  } = useBittensorAnyStakingPayload({
    sapi,
    direction,
    address,
    netuid,
    hotkey: hotkey ?? MOCKED_HOTKEY,
    amount: amount ?? minJoinTaoStake,
    priceLimit: priceLimit ?? 1_000n,
    taostatsFee: taostatsFee ?? 1_000n,
    serverFeeForShieldRao,
  })

  return {
    isLoading:
      isLoadingSapi ||
      isLoadingSimulation ||
      isLoadingMinJoinTaoStake ||
      isLoadingPayload ||
      isLoadingFeeEstimatePayload ||
      isLoadingAlphaPrice ||
      (!!forTaostatsShield && (isLoadingBasePayloadForServerFee || isLoadingBaseFeeEstimate)),
    isError:
      isErrorSapi ||
      isErrorSimulation ||
      isErrorMinJoinTaoStake ||
      isErrorPayload ||
      isErrorFeeEstimatePayload ||
      isErrorAlphaPrice,
    errorPayload,
    amountOut,
    taostatsFee,
    payload: swapPayload?.payload,
    txMetadata: swapPayload?.txMetadata,
    alphaPrice,
    swapPrice,

    feeEstimatePayload: feeEstimatePayload?.payload,

    minJoinTaoStake: minJoinTaoStake,
    minAlphaStake,
    minTaoStake,
    minAlphaUnstake,
    priceImpact,
    slippage,
  }
}

const calculateFee = ({ amount, fee }: { amount: bigint | null; fee: number }): bigint => {
  if (!amount) return 0n
  if (fee < 0) {
    throw new Error("Fee percentage cannot be negative")
  }

  const discountedFee = fee

  return (amount * BigInt(Math.round(discountedFee * 100))) / BigInt(10000)
}

type useBittensorAnyStakingPayloadProps = {
  direction: StakeDirection
  sapi: ScaleApi | undefined | null
  address: string | null
  hotkey: string | null | undefined
  netuid: number | null
  amount: bigint | null | undefined
  priceLimit: bigint | null
  taostatsFee: bigint | null
  serverFeeForShieldRao?: bigint
  enabled?: boolean
}

const useBittensorAnyStakingPayload = ({
  sapi,
  direction,
  address,
  netuid,
  hotkey,
  amount,
  priceLimit,
  taostatsFee,
  serverFeeForShieldRao,
  enabled = true,
}: useBittensorAnyStakingPayloadProps) => {
  return useQuery({
    queryKey: [
      "useBittensorAnyStakingPayload",
      sapi,
      direction,
      address,
      netuid,
      hotkey,
      amount?.toString(),
      priceLimit?.toString(),
      taostatsFee?.toString(),
      serverFeeForShieldRao?.toString(),
    ],
    enabled:
      enabled &&
      !!sapi &&
      !!address &&
      !!hotkey &&
      typeof amount === "bigint" &&
      typeof priceLimit === "bigint" &&
      typeof taostatsFee === "bigint" &&
      typeof netuid === "number",
    queryFn: () => {
      if (
        !sapi ||
        !address ||
        !hotkey ||
        typeof amount !== "bigint" ||
        typeof priceLimit !== "bigint" ||
        typeof taostatsFee !== "bigint" ||
        typeof netuid !== "number"
      )
        return null

      switch (direction) {
        case "taoToAlpha":
          return getBittensorStakingPayload({
            sapi,
            address,
            hotkey,
            amount,
            priceLimit,
            netuid,
            taostatsFee,
            serverFeeForShieldRao,
          })
        case "alphaToTao":
          return getBittensorUnstakePayload({
            sapi,
            address,
            hotkey,
            amount,
            priceLimit,
            netuid,
            taostatsFee,
            serverFeeForShieldRao,
          })
      }
    },
  })
}
