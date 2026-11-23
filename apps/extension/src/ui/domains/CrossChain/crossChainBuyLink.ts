import { Token } from "@taostats-wallet/chaindata-provider"
import { TAOSTATS_WEB_APP_CROSS_CHAIN_SWAP_URL } from "extension-shared"

import { BITTENSOR_MAINNET_ID } from "./constants"

/** The website's cross-chain asset id for Bittensor's TAO. */
export const CROSS_CHAIN_TAO_ASSET_ID = "bt:tao"

/**
 * The website's cross-chain asset id for a token (its `lib/assets.ts`): `bt:tao` for Bittensor's
 * TAO, `bt:sn<netuid>` for a subnet's alpha. `null` for anything else, root (netuid 0) included:
 * the website doesn't swap it.
 */
export const crossChainAssetId = (token: Token | null): string | null => {
  if (!token || token.networkId !== BITTENSOR_MAINNET_ID) return null
  if (token.type === "substrate-native") return CROSS_CHAIN_TAO_ASSET_ID
  if (token.type === "substrate-dtao" && token.netuid > 0) return `bt:sn${token.netuid}`
  return null
}

/**
 * The website's cross-chain swaps on USDC → `assetId` (a `crossChainAssetId`): the wallet has no
 * Ethereum accounts to pay from, so a buy happens there.
 */
export const crossChainBuyUrl = (assetId: string) =>
  // The website's deep link (`lib/deep-link.ts`): ids hold only `[a-z0-9:]`, nothing to escape.
  `${TAOSTATS_WEB_APP_CROSS_CHAIN_SWAP_URL}?from=eth:usdc&to=${assetId}`
