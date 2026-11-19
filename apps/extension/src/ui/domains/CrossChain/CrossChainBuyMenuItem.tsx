import { Token, TokenId } from "@taostats-wallet/chaindata-provider"
import { TAOSTATS_WEB_APP_CROSS_CHAIN_SWAP_URL } from "extension-shared"
import { FC, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { ContextMenuItem } from "taostats-ui"

import { useAnalytics } from "@ui/hooks/useAnalytics"
import { useToken } from "@ui/state"
import { closeIfEmbeddedPopup } from "@ui/util/closeIfEmbeddedPopup"

import { BITTENSOR_MAINNET_ID } from "./constants"
import { useIsCrossChainSellEnabled } from "./crossChainSellGate"

/**
 * The website's cross-chain asset id for a token (its `lib/assets.ts`): `bt:tao` for Bittensor's
 * TAO, `bt:sn<netuid>` for a subnet's alpha. `null` for anything else, root (netuid 0) included:
 * the website doesn't swap it.
 */
const crossChainAssetId = (token: Token | null): string | null => {
  if (!token || token.networkId !== BITTENSOR_MAINNET_ID) return null
  if (token.type === "substrate-native") return "bt:tao"
  if (token.type === "substrate-dtao" && token.netuid > 0) return `bt:sn${token.netuid}`
  return null
}

/**
 * "Buy with USDC or ETH" in a token's menu: the wallet has no Ethereum accounts to pay from, so it
 * opens the website's cross-chain swaps on USDC → this token. Behind the same gates as the sell
 * (the build and our API), whatever the balance.
 */
export const CrossChainBuyMenuItem: FC<{ tokenId: TokenId }> = ({ tokenId }) => {
  const { t } = useTranslation()
  const { genericEvent } = useAnalytics()
  const isEnabled = useIsCrossChainSellEnabled()
  const token = useToken(tokenId)
  const assetId = crossChainAssetId(token)

  const handleClick = useCallback(() => {
    if (!assetId) return
    // The website's deep link (`lib/deep-link.ts`): ids hold only `[a-z0-9:]`, nothing to escape.
    window.open(`${TAOSTATS_WEB_APP_CROSS_CHAIN_SWAP_URL}?from=eth:usdc&to=${assetId}`, "_blank")
    genericEvent("open cross-chain buy", {
      from: "token menu",
      asset: assetId === "bt:tao" ? "tao" : "alpha",
    })
    closeIfEmbeddedPopup()
  }, [assetId, genericEvent])

  if (!isEnabled || !assetId) return null

  return <ContextMenuItem onClick={handleClick}>{t("Buy with USDC or ETH")}</ContextMenuItem>
}
