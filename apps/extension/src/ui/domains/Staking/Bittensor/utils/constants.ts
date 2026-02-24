import { subNativeTokenId } from "@taostats-wallet/chaindata-provider"

import { RootClaimType } from "../../hooks/bittensor/dTao/types"

export const ROOT_NETUID = 0
export const DEFAULT_USER_MAX_SLIPPAGE = 0.5 // 0.5%
export const HIGH_PRICE_IMPACT = 2
export const VERY_HIGH_PRICE_IMPACT = 5
export const BITTENSOR_TOKEN_ID = subNativeTokenId("bittensor")

export const TAOSTATS_FEE_RECEIVER_ADDRESS_BITTENSOR =
  "5DceuTr7XPqw67PNHW9ewzzo2cZ7Cm8HgfjwUqEpd8Mh8QNg"

/**
 * Taostats Shield: wallet that receives the transfer used to pay for the outer extrinsic.
 * When using Taostats Shield, the outer MevShield.submitEncrypted call is submitted by
 * Taostats (not the user), so we include a transfer in the batch purely to cover that
 * extrinsic cost. This is not a staking fee or profit—Taostats does not charge a
 * staking fee in any of its apps.
 */
export const MEVSHIELD_SERVER_FEE_WALLET_ADDRESS =
  "5DceuTr7XPqw67PNHW9ewzzo2cZ7Cm8HgfjwUqEpd8Mh8QNg"

/**
 * Fixed amount in rao (15_000) transferred to the server fee wallet when using Taostats Shield.
 * Covers the submitEncrypted extrinsic cost only (see above). Not a staking fee — Taostats
 * does not charge a staking fee in any of its apps.
 * Inner tx is batch([userCall, transfer(feeWallet, this)]).
 */
export const MEVSHIELD_SERVER_FEE_RAO = 15_000n

// Taostats does not charge a staking fee in any of its apps.
export const TAOSTATS_FEE_BITTENSOR = 0

export const DEFAULT_ROOT_CLAIM_TYPE: RootClaimType = "Swap"
