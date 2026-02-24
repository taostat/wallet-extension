import { Enum } from "@polkadot-api/substrate-bindings"
import { TAO_DECIMALS } from "@taostats-wallet/balances"
import { ScaleApi } from "@taostats-wallet/sapi"

import { StakeDirection } from "../hooks/types"
import {
  MEVSHIELD_SERVER_FEE_WALLET_ADDRESS,
  ROOT_NETUID,
  TAOSTATS_FEE_RECEIVER_ADDRESS_BITTENSOR,
} from "./constants"

const withFeeTransfer = (taostatsFee: bigint) => taostatsFee > 0n
const withServerFeeTransfer = (serverFeeForShieldRao: bigint | undefined) =>
  serverFeeForShieldRao !== undefined && serverFeeForShieldRao > 0n

const taostatsFeeTransferCall = (sapi: ScaleApi, taostatsFee: bigint) =>
  sapi.getDecodedCall("Balances", "transfer_keep_alive", {
    dest: Enum("Id", TAOSTATS_FEE_RECEIVER_ADDRESS_BITTENSOR),
    value: taostatsFee,
  })

const serverFeeTransferCall = (sapi: ScaleApi, serverFeeForShieldRao: bigint) =>
  sapi.getDecodedCall("Balances", "transfer_keep_alive", {
    dest: Enum("Id", MEVSHIELD_SERVER_FEE_WALLET_ADDRESS),
    value: serverFeeForShieldRao,
  })

export type BittensorSwapSimulation = {
  tao_amount: bigint
  alpha_amount: bigint
  tao_fee: bigint
  alpha_fee: bigint
}

export const getSwapSimulation = async (
  sapi: ScaleApi,
  netuid: number,
  direction: StakeDirection,
  amount: bigint,
) => {
  const method = direction === "taoToAlpha" ? "sim_swap_tao_for_alpha" : "sim_swap_alpha_for_tao"

  // this will simulate the swap over the different layers of liquidity available in the pool, output is deterministic
  return sapi.getRuntimeCallValue<BittensorSwapSimulation>("SwapRuntimeApi", method, [
    netuid,
    amount,
  ])
}

export const getLimitPrice = (
  simulation: BittensorSwapSimulation,
  direction: StakeDirection,
  tolerance: number = 0, // 0.0005 = 0.05%
) => {
  // prevent division by zero
  if (!simulation.alpha_amount) return 0n

  const toleranceScaleFactor = 10_000n // dont expect more than 4 decimal places in tolerance
  const scaledTolerance = BigInt(Math.round(tolerance * Number(toleranceScaleFactor)))

  // price based on the simulation result
  const unit = 10n ** BigInt(TAO_DECIMALS)
  const price = (simulation.tao_amount * unit) / simulation.alpha_amount

  // limit price with tolerance
  const limitPrice =
    direction === "taoToAlpha"
      ? (price * (toleranceScaleFactor + scaledTolerance)) / toleranceScaleFactor
      : (price * (toleranceScaleFactor - scaledTolerance)) / toleranceScaleFactor

  return limitPrice
}

type StakeAction = "stake" | "unstake"

type SubtensorCallConfig = {
  method: "add_stake" | "add_stake_limit" | "remove_stake" | "remove_stake_limit"
  args: Record<string, unknown>
}

const SUBTENSOR_METHODS: Record<
  StakeAction,
  { root: SubtensorCallConfig["method"]; limit: SubtensorCallConfig["method"] }
> = {
  stake: {
    root: "add_stake",
    limit: "add_stake_limit",
  },
  unstake: {
    root: "remove_stake",
    limit: "remove_stake_limit",
  },
}

const AMOUNT_FIELD: Record<StakeAction, "amount_staked" | "amount_unstaked"> = {
  stake: "amount_staked",
  unstake: "amount_unstaked",
}

const getSubtensorCallConfig = (
  action: StakeAction,
  isRootSubnet: boolean,
  {
    hotkey,
    netuid,
    amount,
    priceLimit,
  }: {
    hotkey: string
    netuid: number
    amount: bigint
    priceLimit: bigint
  },
): SubtensorCallConfig => {
  const mode = isRootSubnet ? "root" : "limit"
  const method = SUBTENSOR_METHODS[action][mode]
  const amountField = AMOUNT_FIELD[action]

  const args: Record<string, unknown> = {
    hotkey,
    netuid: isRootSubnet ? ROOT_NETUID : netuid,
    [amountField]: amount,
  }

  if (!isRootSubnet) {
    Object.assign(args, {
      limit_price: priceLimit,
      allow_partial: false,
    })
  }

  return { method, args }
}

const buildBittensorPayload = ({
  sapi,
  address,
  taostatsFee,
  serverFeeForShieldRao,
  isRootSubnet,
  callConfig,
}: {
  sapi: ScaleApi
  address: string
  taostatsFee: bigint
  serverFeeForShieldRao?: bigint
  isRootSubnet: boolean
  callConfig: SubtensorCallConfig
}) => {
  const hasTaostatsFee = withFeeTransfer(taostatsFee)
  const shouldAddTaostatsShieldFee = withServerFeeTransfer(serverFeeForShieldRao)
  const taostatsShieldFeeRao = serverFeeForShieldRao ?? 0n

  const getMainDecodedCall = () =>
    sapi.getDecodedCall("SubtensorModule", callConfig.method, callConfig.args)

  if (!hasTaostatsFee) {
    if (!shouldAddTaostatsShieldFee) {
      return sapi.getExtrinsicPayload("SubtensorModule", callConfig.method, callConfig.args, {
        address,
      })
    }

    const calls = [getMainDecodedCall(), serverFeeTransferCall(sapi, taostatsShieldFeeRao)]
    return sapi.getExtrinsicPayload("Utility", "batch_all", { calls }, { address })
  }

  const calls = [
    getMainDecodedCall(),
    ...(isRootSubnet ? [] : [taostatsFeeTransferCall(sapi, taostatsFee)]),
    ...(shouldAddTaostatsShieldFee ? [serverFeeTransferCall(sapi, taostatsShieldFeeRao)] : []),
  ]

  return sapi.getExtrinsicPayload("Utility", "batch_all", { calls }, { address })
}

export const getBittensorStakingPayload = async ({
  sapi,
  address,
  hotkey,
  amount,
  priceLimit,
  netuid,
  taostatsFee,
  serverFeeForShieldRao,
}: {
  sapi: ScaleApi
  address: string
  hotkey: string
  amount: bigint
  priceLimit: bigint
  netuid: number
  taostatsFee: bigint
  serverFeeForShieldRao?: bigint
}) => {
  const isRootSubnet = netuid === 0

  const callConfig = getSubtensorCallConfig("stake", isRootSubnet, {
    hotkey,
    netuid,
    amount,
    priceLimit,
  })

  return buildBittensorPayload({
    sapi,
    address,
    taostatsFee,
    serverFeeForShieldRao,
    isRootSubnet,
    callConfig,
  })
}

type GetBittensorUnstakePayload = {
  sapi: ScaleApi
  address: string
  hotkey: string
  amount: bigint
  taostatsFee: bigint
  priceLimit: bigint
  netuid: number
  serverFeeForShieldRao?: bigint
}

export const getBittensorUnstakePayload = ({
  sapi,
  address,
  hotkey,
  amount,
  netuid,
  priceLimit,
  taostatsFee,
  serverFeeForShieldRao,
}: GetBittensorUnstakePayload) => {
  const isRootSubnet = netuid === ROOT_NETUID

  const callConfig = getSubtensorCallConfig("unstake", isRootSubnet, {
    hotkey,
    netuid,
    amount,
    priceLimit,
  })

  return buildBittensorPayload({
    sapi,
    address,
    taostatsFee,
    serverFeeForShieldRao,
    isRootSubnet,
    callConfig,
  })
}
