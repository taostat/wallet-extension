import { taoToAlpha } from "@taostats-wallet/balances"
import { useCallback, useEffect, useMemo, useState } from "react"

import { useScaleApi } from "@ui/hooks/sapi/useScaleApi"

import { useGetBittensorMinJoinStake } from "../../hooks/bittensor/useGetBittensorMinJoinStake"
import { useGetBittensorDefaultMinStake } from "../../hooks/bittensor/useGetBittensorMinStake"
import { MEVSHIELD_SERVER_FEE_RAO } from "../utils/constants"
import {
  getBittensorStakingPayload,
  getBittensorUnstakePayload,
  getLimitPrice,
} from "../utils/helpers"
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

const AMOUNT_DEBOUNCE_MS = 400

const useDebouncedValue = <T>(value: T, delay: number): T => {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timeout)
  }, [value, delay])
  return debounced
}

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

  // Chain calls follow the settled amount so typing does not rebuild a payload per digit.
  const settledAmountIn = useDebouncedValue(amountIn, AMOUNT_DEBOUNCE_MS)
  const amountPending = amountIn !== settledAmountIn

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
    if (typeof netuid !== "number" || typeof settledAmountIn !== "bigint") return null
    if (netuid === 0) return settledAmountIn

    switch (direction) {
      case "taoToAlpha": {
        const appStakingFee = calculateFee({
          amount: settledAmountIn,
          fee: subnetFee,
        })
        return settledAmountIn - appStakingFee
      }
      case "alphaToTao":
        return settledAmountIn
    }
  }, [settledAmountIn, direction, netuid, subnetFee])

  const {
    data: simulation,
    isLoading: isLoadingSimulation,
    isError: isErrorSimulation,
    error: quoteError,
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
    if (typeof settledAmountIn !== "bigint" || !simulation) return null
    // WARNING: because of slippage it would make more sense to send alpha instead of tao when unstaking
    return calculateFee({
      amount: direction === "taoToAlpha" ? settledAmountIn : simulation?.tao_amount,
      fee: subnetFee,
    })
  }, [settledAmountIn, direction, simulation, subnetFee])

  const amountOut = useMemo(() => {
    if (!simulation || typeof taostatsFee !== "bigint") return 0n // TODO should be null

    switch (direction) {
      case "taoToAlpha":
        return simulation.alpha_amount
      case "alphaToTao":
        return simulation.tao_amount - taostatsFee
    }
  }, [direction, simulation, taostatsFee])

  const serverFeeForShieldRao = useMemo(() => {
    if (!forTaostatsShield) return undefined
    return MEVSHIELD_SERVER_FEE_RAO
  }, [forTaostatsShield])

  const isQuoteReady =
    !amountPending &&
    !isErrorSimulation &&
    typeof amount === "bigint" &&
    !!simulation &&
    typeof priceLimit === "bigint" &&
    typeof taostatsFee === "bigint"

  const prepareSignerPayload = useCallback(async () => {
    if (
      !sapi ||
      !address ||
      !hotkey ||
      typeof amount !== "bigint" ||
      typeof priceLimit !== "bigint" ||
      typeof taostatsFee !== "bigint" ||
      typeof netuid !== "number"
    )
      throw new Error("Stake details are not ready")

    const args = {
      sapi,
      address,
      hotkey,
      amount,
      priceLimit,
      netuid,
      taostatsFee,
      serverFeeForShieldRao,
    }

    switch (direction) {
      case "taoToAlpha":
        return getBittensorStakingPayload(args)
      case "alphaToTao":
        return getBittensorUnstakePayload(args)
    }
  }, [
    address,
    amount,
    direction,
    hotkey,
    netuid,
    priceLimit,
    sapi,
    serverFeeForShieldRao,
    taostatsFee,
  ])

  return {
    isLoading:
      amountPending ||
      isLoadingSapi ||
      isLoadingSimulation ||
      isLoadingMinJoinTaoStake ||
      isLoadingAlphaPrice,
    isError: isErrorSapi || isErrorSimulation || isErrorMinJoinTaoStake || isErrorAlphaPrice,
    isQuoteReady,
    quoteError: amountPending ? null : quoteError,
    prepareSignerPayload,
    amountOut: amountPending ? 0n : amountOut,
    taostatsFee,
    alphaPrice,
    swapPrice: amountPending ? null : swapPrice,

    minJoinTaoStake: minJoinTaoStake,
    minAlphaStake,
    minTaoStake,
    minAlphaUnstake,
    priceImpact: amountPending ? null : priceImpact,
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
