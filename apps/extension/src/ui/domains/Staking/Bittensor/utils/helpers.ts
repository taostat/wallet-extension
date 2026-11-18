import { Enum } from "@polkadot-api/substrate-bindings"
import { TAO_DECIMALS } from "@taostats-wallet/balances"
import { ScaleApi } from "@taostats-wallet/sapi"

import { StakeDirection } from "../hooks/types"
import {
  HIGH_PRICE_IMPACT,
  MEVSHIELD_SERVER_FEE_WALLET_ADDRESS,
  ROOT_NETUID,
  TAOSTATS_FEE_RECEIVER_ADDRESS_BITTENSOR,
  VERY_HIGH_PRICE_IMPACT,
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

/**
 * A swap simulation plus the pool state it was priced against.
 * Prices are in rao per alpha (TAO per alpha scaled by 10^9), like `current_alpha_price` and `limit_price`.
 */
export type BittensorSwapQuote = {
  simulation: BittensorSwapSimulation
  /** Pool price before the swap */
  spotPrice: bigint
  /** SubnetTAO */
  taoReserve: bigint
  /** SubnetAlphaIn */
  alphaReserve: bigint
}

export const getSwapQuote = async (
  sapi: ScaleApi,
  netuid: number,
  direction: StakeDirection,
  amount: bigint,
): Promise<BittensorSwapQuote> => {
  const method = direction === "taoToAlpha" ? "sim_swap_tao_for_alpha" : "sim_swap_alpha_for_tao"

  const [simulation, spotPrice, taoReserve, alphaReserve] = await Promise.all([
    // this will simulate the swap over the different layers of liquidity available in the pool, output is deterministic
    sapi.getRuntimeCallValue<BittensorSwapSimulation>("SwapRuntimeApi", method, [netuid, amount]),
    sapi.getRuntimeCallValue<bigint>("SwapRuntimeApi", "current_alpha_price", [netuid]),
    sapi.getStorage<bigint>("SubtensorModule", "SubnetTAO", [netuid]),
    sapi.getStorage<bigint>("SubtensorModule", "SubnetAlphaIn", [netuid]),
  ])

  return {
    simulation,
    spotPrice: BigInt(spotPrice ?? 0),
    taoReserve: BigInt(taoReserve ?? 0),
    alphaReserve: BigInt(alphaReserve ?? 0),
  }
}

const PRICE_UNIT = 10n ** BigInt(TAO_DECIMALS)
const TOLERANCE_SCALE = 10_000n // dont expect more than 4 decimal places in tolerance

const divCeil = (a: bigint, b: bigint) => (a + b - 1n) / b

/** Average price paid across the whole swap. This is what the user gets, not where the pool ends up. */
export const getAverageSwapPrice = (simulation: BittensorSwapSimulation) => {
  if (!simulation.alpha_amount) return 0n
  return (simulation.tao_amount * PRICE_UNIT) / simulation.alpha_amount
}

/**
 * Pool price once the swap has gone through.
 *
 * Subtensor prices pools as `(w_base / w_quote) * taoReserve / alphaReserve`, and the weights do not change
 * during a swap, so the end price is the spot price scaled by how the reserves ratio moves.
 * Simulated amounts exclude the swap fee, which goes to the block author rather than the pool.
 *
 * Rounded against the user (up for stake, down for unstake) so a limit built on top of it never lands
 * on the wrong side of what the chain computes.
 */
export const getEndPrice = (
  { simulation, spotPrice, taoReserve, alphaReserve }: BittensorSwapQuote,
  direction: StakeDirection,
) => {
  if (spotPrice <= 0n || taoReserve <= 0n || alphaReserve <= 0n) return null

  const isStake = direction === "taoToAlpha"
  const taoAfter = isStake ? taoReserve + simulation.tao_amount : taoReserve - simulation.tao_amount
  const alphaAfter = isStake
    ? alphaReserve - simulation.alpha_amount
    : alphaReserve + simulation.alpha_amount
  if (taoAfter <= 0n || alphaAfter <= 0n) return null

  const denominator = taoReserve * alphaAfter

  // spotPrice is truncated by the runtime api, so the true spot is in [spotPrice, spotPrice + 1).
  // Use the upper bound when staking so the result never falls below the true end price.
  return isStake
    ? divCeil((spotPrice + 1n) * taoAfter * alphaReserve, denominator)
    : (spotPrice * taoAfter * alphaReserve) / denominator
}

/**
 * Limit price for add_stake_limit / remove_stake_limit.
 * The chain stops the swap when the pool price reaches this value, so it is built from the END price:
 * the tolerance is headroom for the price moving after the user signs, on top of the impact they were shown.
 */
export const getLimitPrice = (
  endPrice: bigint,
  direction: StakeDirection,
  tolerance: number = 0, // 0.005 = 0.5%
) => {
  const scaledTolerance = BigInt(Math.round(tolerance * Number(TOLERANCE_SCALE)))

  return direction === "taoToAlpha"
    ? divCeil(endPrice * (TOLERANCE_SCALE + scaledTolerance), TOLERANCE_SCALE)
    : (endPrice * (TOLERANCE_SCALE - scaledTolerance)) / TOLERANCE_SCALE
}

/**
 * Worst average price the user can end up paying (stake) or receiving (unstake) per alpha, given
 * their slippage tolerance: the expected average price moved by the tolerance. Approximate, because
 * the chain enforces the tolerance on the pool price after the swap, which moves with the average
 * price but not by exactly the same amount.
 */
export const getWorstCasePrice = (
  expectedPrice: bigint,
  direction: StakeDirection,
  tolerance: number = 0, // 0.005 = 0.5%
) => getLimitPrice(expectedPrice, direction, tolerance)

/**
 * The least the swap returns (alpha for a stake, TAO for an unstake) before the chain cancels it,
 * given the slippage tolerance. Approximate, like `getWorstCasePrice`.
 */
export const getMinimumAmountOut = (
  amountOut: bigint,
  direction: StakeDirection,
  tolerance: number = 0, // 0.005 = 0.5%
) => {
  const scaledTolerance = BigInt(Math.round(tolerance * Number(TOLERANCE_SCALE)))

  return direction === "taoToAlpha"
    ? (amountOut * TOLERANCE_SCALE) / (TOLERANCE_SCALE + scaledTolerance)
    : (amountOut * (TOLERANCE_SCALE - scaledTolerance)) / TOLERANCE_SCALE
}

/**
 * How far `price` sits from the spot price, as a positive percentage (2 = 2%).
 * Shown to the user with the average swap price: how much worse than the current price the trade
 * fills on average, which is what it costs them. The pool itself ends about twice as far away.
 */
export const getPriceImpact = (spotPrice: bigint, price: bigint) => {
  if (spotPrice <= 0n) return null
  const diff = price > spotPrice ? price - spotPrice : spotPrice - price
  return Number((diff * 1_000_000n) / spotPrice) / 10_000
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

type BittensorCallTarget = {
  pallet: string
  method: string
  args: unknown
}

const getBittensorCallTarget = ({
  sapi,
  taostatsFee,
  serverFeeForShieldRao,
  isRootSubnet,
  callConfig,
}: {
  sapi: ScaleApi
  taostatsFee: bigint
  serverFeeForShieldRao?: bigint
  isRootSubnet: boolean
  callConfig: SubtensorCallConfig
}): BittensorCallTarget => {
  const hasTaostatsFee = withFeeTransfer(taostatsFee)
  const shouldAddTaostatsShieldFee = withServerFeeTransfer(serverFeeForShieldRao)
  const taostatsShieldFeeRao = serverFeeForShieldRao ?? 0n

  const getMainDecodedCall = () =>
    sapi.getDecodedCall("SubtensorModule", callConfig.method, callConfig.args)

  if (!hasTaostatsFee) {
    if (!shouldAddTaostatsShieldFee) {
      return { pallet: "SubtensorModule", method: callConfig.method, args: callConfig.args }
    }

    return {
      pallet: "Utility",
      method: "batch_all",
      args: { calls: [getMainDecodedCall(), serverFeeTransferCall(sapi, taostatsShieldFeeRao)] },
    }
  }

  return {
    pallet: "Utility",
    method: "batch_all",
    args: {
      calls: [
        getMainDecodedCall(),
        ...(isRootSubnet ? [] : [taostatsFeeTransferCall(sapi, taostatsFee)]),
        ...(shouldAddTaostatsShieldFee ? [serverFeeTransferCall(sapi, taostatsShieldFeeRao)] : []),
      ],
    },
  }
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
  const call = getBittensorCallTarget({
    sapi,
    taostatsFee,
    serverFeeForShieldRao,
    isRootSubnet,
    callConfig,
  })

  return sapi.getExtrinsicPayload(call.pallet, call.method, call.args, { address })
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

type BittensorCallArgs = {
  sapi: ScaleApi
  address: string
  hotkey: string
  amount: bigint
  priceLimit: bigint
  netuid: number
  taostatsFee: bigint
  serverFeeForShieldRao?: bigint
  action: StakeAction
  genesisHash: `0x${string}`
}

/** One query_info on a locally fake-signed extrinsic. Does not read nonce or block hashes. */
export const getBittensorInclusionFee = ({
  sapi,
  address,
  hotkey,
  amount,
  priceLimit,
  netuid,
  taostatsFee,
  serverFeeForShieldRao,
  action,
  genesisHash,
}: BittensorCallArgs) => {
  const isRootSubnet = netuid === ROOT_NETUID
  const callConfig = getSubtensorCallConfig(action, isRootSubnet, {
    hotkey,
    netuid,
    amount,
    priceLimit,
  })
  const call = getBittensorCallTarget({
    sapi,
    taostatsFee,
    serverFeeForShieldRao,
    isRootSubnet,
    callConfig,
  })

  return sapi.getInclusionFee(call.pallet, call.method, call.args, address, genesisHash)
}

export type PriceImpactLevel = "normal" | "high" | "very-high"

export const getPriceImpactLevel = (priceImpact: number | null | undefined): PriceImpactLevel => {
  if (typeof priceImpact !== "number") return "normal"
  if (priceImpact >= VERY_HIGH_PRICE_IMPACT) return "very-high"
  if (priceImpact >= HIGH_PRICE_IMPACT) return "high"
  return "normal"
}
