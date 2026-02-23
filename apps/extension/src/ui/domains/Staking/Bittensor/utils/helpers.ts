import { Enum } from "@polkadot-api/substrate-bindings"
import { TAO_DECIMALS } from "@taostats-wallet/balances"
import { ScaleApi } from "@taostats-wallet/sapi"
import { Binary } from "polkadot-api"

import { StakeDirection } from "../hooks/types"
import {
  MEVSHIELD_SERVER_FEE_WALLET_ADDRESS,
  ROOT_NETUID,
  TAOSTATS_FEE_RECEIVER_ADDRESS_BITTENSOR,
} from "./constants"

const withFeeTransfer = (taostatsFee: bigint) => taostatsFee > 0n
const withServerFeeTransfer = (serverFeeForShieldRao: bigint | undefined) =>
  serverFeeForShieldRao !== undefined && serverFeeForShieldRao > 0n

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

const serverFeeTransferCall = (
  sapi: ScaleApi,
  serverFeeForShieldRao: bigint,
) =>
  sapi.getDecodedCall("Balances", "transfer_keep_alive", {
    dest: Enum("Id", MEVSHIELD_SERVER_FEE_WALLET_ADDRESS),
    value: serverFeeForShieldRao,
  })

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
  const addServerFee = withServerFeeTransfer(serverFeeForShieldRao)
  const serverFeeRao = serverFeeForShieldRao ?? 0n

  if (netuid === 0) {
    if (!withFeeTransfer(taostatsFee)) {
      if (!addServerFee) {
        return sapi.getExtrinsicPayload(
          "SubtensorModule",
          "add_stake",
          {
            hotkey,
            netuid: ROOT_NETUID,
            amount_staked: amount,
          },
          { address },
        )
      }
      return sapi.getExtrinsicPayload(
        "Utility",
        "batch_all",
        {
          calls: [
            sapi.getDecodedCall("SubtensorModule", "add_stake", {
              hotkey,
              netuid: ROOT_NETUID,
              amount_staked: amount,
            }),
            serverFeeTransferCall(sapi, serverFeeRao),
          ],
        },
        { address },
      )
    }
    const calls = [
      sapi.getDecodedCall("SubtensorModule", "add_stake", {
        hotkey,
        netuid: ROOT_NETUID,
        amount_staked: amount,
      }),
      ...(addServerFee ? [serverFeeTransferCall(sapi, serverFeeRao)] : []),
      sapi.getDecodedCall("System", "remark_with_event", {
        remark: Binary.fromText("taostats-bittensor"),
      }),
    ]
    return sapi.getExtrinsicPayload("Utility", "batch_all", { calls }, { address })
  }
  if (!withFeeTransfer(taostatsFee)) {
    if (!addServerFee) {
      return sapi.getExtrinsicPayload(
        "SubtensorModule",
        "add_stake_limit",
        {
          hotkey,
          netuid,
          amount_staked: amount,
          limit_price: priceLimit,
          allow_partial: false,
        },
        { address },
      )
    }
    return sapi.getExtrinsicPayload(
      "Utility",
      "batch_all",
      {
        calls: [
          sapi.getDecodedCall("SubtensorModule", "add_stake_limit", {
            hotkey,
            netuid,
            amount_staked: amount,
            limit_price: priceLimit,
            allow_partial: false,
          }),
          serverFeeTransferCall(sapi, serverFeeRao),
        ],
      },
      { address },
    )
  }
  const calls = [
    sapi.getDecodedCall("SubtensorModule", "add_stake_limit", {
      hotkey,
      netuid,
      amount_staked: amount,
      limit_price: priceLimit,
      allow_partial: false,
    }),
    sapi.getDecodedCall("Balances", "transfer_keep_alive", {
      dest: Enum("Id", TAOSTATS_FEE_RECEIVER_ADDRESS_BITTENSOR),
      value: taostatsFee,
    }),
    ...(addServerFee ? [serverFeeTransferCall(sapi, serverFeeRao)] : []),
    sapi.getDecodedCall("System", "remark_with_event", {
      remark: Binary.fromText("taostats-bittensor"),
    }),
  ]
  return sapi.getExtrinsicPayload("Utility", "batch_all", { calls }, { address })
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
  const addServerFee = withServerFeeTransfer(serverFeeForShieldRao)
  const serverFeeRao = serverFeeForShieldRao ?? 0n

  if (netuid === ROOT_NETUID) {
    if (!withFeeTransfer(taostatsFee)) {
      if (!addServerFee) {
        return sapi.getExtrinsicPayload(
          "SubtensorModule",
          "remove_stake",
          {
            hotkey,
            netuid: ROOT_NETUID,
            amount_unstaked: amount,
          },
          { address },
        )
      }
      return sapi.getExtrinsicPayload(
        "Utility",
        "batch_all",
        {
          calls: [
            sapi.getDecodedCall("SubtensorModule", "remove_stake", {
              hotkey,
              netuid: ROOT_NETUID,
              amount_unstaked: amount,
            }),
            serverFeeTransferCall(sapi, serverFeeRao),
          ],
        },
        { address },
      )
    }
    const calls = [
      sapi.getDecodedCall("SubtensorModule", "remove_stake", {
        hotkey,
        netuid: ROOT_NETUID,
        amount_unstaked: amount,
      }),
      ...(addServerFee ? [serverFeeTransferCall(sapi, serverFeeRao)] : []),
      sapi.getDecodedCall("System", "remark_with_event", {
        remark: Binary.fromText("taostats-bittensor"),
      }),
    ]
    return sapi.getExtrinsicPayload("Utility", "batch_all", { calls }, { address })
  }
  if (!withFeeTransfer(taostatsFee)) {
    if (!addServerFee) {
      return sapi.getExtrinsicPayload(
        "SubtensorModule",
        "remove_stake_limit",
        {
          hotkey,
          netuid,
          amount_unstaked: amount,
          limit_price: priceLimit,
          allow_partial: false,
        },
        { address },
      )
    }
    return sapi.getExtrinsicPayload(
      "Utility",
      "batch_all",
      {
        calls: [
          sapi.getDecodedCall("SubtensorModule", "remove_stake_limit", {
            hotkey,
            netuid,
            amount_unstaked: amount,
            limit_price: priceLimit,
            allow_partial: false,
          }),
          serverFeeTransferCall(sapi, serverFeeRao),
        ],
      },
      { address },
    )
  }
  const calls = [
    sapi.getDecodedCall("SubtensorModule", "remove_stake_limit", {
      hotkey,
      netuid,
      amount_unstaked: amount,
      limit_price: priceLimit,
      allow_partial: false,
    }),
    sapi.getDecodedCall("Balances", "transfer_keep_alive", {
      dest: Enum("Id", TAOSTATS_FEE_RECEIVER_ADDRESS_BITTENSOR),
      value: taostatsFee,
    }),
    ...(addServerFee ? [serverFeeTransferCall(sapi, serverFeeRao)] : []),
    sapi.getDecodedCall("System", "remark_with_event", {
      remark: Binary.fromText("taostats-bittensor"),
    }),
  ]
  return sapi.getExtrinsicPayload("Utility", "batch_all", { calls }, { address })
}
