import { subNativeTokenId } from "@taostats-wallet/chaindata-provider"

import { RootClaimType } from "../../hooks/bittensor/dTao/types"

export const ROOT_NETUID = 0
export const DEFAULT_USER_MAX_SLIPPAGE = 0.5 // 0.5%
export const HIGH_PRICE_IMPACT = 2
export const VERY_HIGH_PRICE_IMPACT = 5
export const BITTENSOR_TOKEN_ID = subNativeTokenId("bittensor")

export const TAOSTATS_FEE_RECEIVER_ADDRESS_BITTENSOR =
  "5FNxL46parYKx4yPZcihEWuAFYtGE92SLgWStsHDjodanPSG"

/** MevShield server fee wallet: receives transfer so server can pay submitEncrypted extrinsic (same as monorepo). */
export const MEVSHIELD_SERVER_FEE_WALLET_ADDRESS =
  "5DceuTr7XPqw67PNHW9ewzzo2cZ7Cm8HgfjwUqEpd8Mh8QNg"

/** Fixed server fee in rao (~0.0003 TAO) for Taostats Shield submitEncrypted; */
export const MEVSHIELD_SERVER_FEE_RAO = 300_000n

export const TAOSTATS_FEE_BITTENSOR = 0

export const DEFAULT_ROOT_CLAIM_TYPE: RootClaimType = "Swap"
