import { TokenId } from "@taostats-wallet/chaindata-provider"
import { FC, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { ContextMenuItem } from "taostats-ui"

import { useAnalytics } from "@ui/hooks/useAnalytics"
import { useToken } from "@ui/state"
import { closeIfEmbeddedPopup } from "@ui/util/closeIfEmbeddedPopup"

import { CROSS_CHAIN_TAO_ASSET_ID, crossChainAssetId, crossChainBuyUrl } from "./crossChainBuyLink"
import { useIsCrossChainSellEnabled } from "./crossChainSellGate"

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
    window.open(crossChainBuyUrl(assetId), "_blank")
    genericEvent("open cross-chain buy", {
      from: "token menu",
      asset: assetId === CROSS_CHAIN_TAO_ASSET_ID ? "tao" : "alpha",
    })
    closeIfEmbeddedPopup()
  }, [assetId, genericEvent])

  if (!isEnabled || !assetId) return null

  return <ContextMenuItem onClick={handleClick}>{t("Buy with USDC or ETH")}</ContextMenuItem>
}
