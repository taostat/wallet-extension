import { isAddressEqual } from "@taostats-wallet/crypto"
import { TAOSTATS_WEB_APP_SWAP_URL } from "extension-shared"
import { FC, useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { ContextMenuItem } from "taostats-ui"

import { BITTENSOR_MAINNET_ID } from "@ui/domains/CrossChain/constants"
import {
  CROSS_CHAIN_TAO_ASSET_ID,
  crossChainBuyUrl,
} from "@ui/domains/CrossChain/crossChainBuyLink"
import { pickTaoSellOpenOptions, TaoHolding } from "@ui/domains/CrossChain/taoSellOpenOptions"
import { useCrossChainSellModal } from "@ui/domains/CrossChain/useCrossChainSellModal"
import { useAnalytics } from "@ui/hooks/useAnalytics"
import { useAccounts, useBalances } from "@ui/state"
import { closeIfEmbeddedPopup } from "@ui/util/closeIfEmbeddedPopup"

import { usePortfolioNavigation } from "./usePortfolioNavigation"

const SWAP_MENU = "swap menu"

/** "Swap on Bittensor": the website's swap, as the Swap button opened before it had a menu. */
const BittensorSwapMenuItem: FC = () => {
  const { t } = useTranslation()
  const { genericEvent } = useAnalytics()

  const handleClick = useCallback(() => {
    window.open(TAOSTATS_WEB_APP_SWAP_URL, "_blank")
    genericEvent("open bittensor swap", { from: SWAP_MENU })
  }, [genericEvent])

  return <ContextMenuItem onClick={handleClick}>{t("Swap on Bittensor")}</ContextMenuItem>
}

/**
 * "Sell for USDC or ETH": the extension's sell of TAO, from the account `pickTaoSellOpenOptions`
 * picks among the portfolio's selected accounts. Hidden when none qualifies.
 */
const TaoSellMenuItem: FC = () => {
  const { t } = useTranslation()
  const { genericEvent } = useAnalytics()
  const { open } = useCrossChainSellModal()
  const { selectedAccount, selectedAccounts } = usePortfolioNavigation()
  const accounts = useAccounts("owned")
  const balances = useBalances()

  const openOptions = useMemo(() => {
    const holdings = balances.each
      .filter(
        (b) =>
          b.token?.networkId === BITTENSOR_MAINNET_ID &&
          b.token.type === "substrate-native" &&
          selectedAccounts.some((a) => isAddressEqual(a.address, b.address)),
      )
      .map<TaoHolding>((b) => ({
        address: b.address,
        tokenId: b.tokenId,
        transferable: b.transferable.planck,
      }))
    return pickTaoSellOpenOptions({
      holdings,
      accounts,
      selectedAddress: selectedAccount?.address,
    })
  }, [accounts, balances, selectedAccount?.address, selectedAccounts])

  const handleClick = useCallback(() => {
    if (!openOptions) return
    open(openOptions)
    genericEvent("open cross-chain sell", { from: SWAP_MENU, asset: "tao" })
  }, [genericEvent, open, openOptions])

  if (!openOptions) return null

  return <ContextMenuItem onClick={handleClick}>{t("Sell for USDC or ETH")}</ContextMenuItem>
}

/** "Buy with USDC or ETH": the website's cross-chain swaps on USDC → TAO (see `CrossChainBuyMenuItem`). */
const TaoBuyMenuItem: FC = () => {
  const { t } = useTranslation()
  const { genericEvent } = useAnalytics()

  const handleClick = useCallback(() => {
    window.open(crossChainBuyUrl(CROSS_CHAIN_TAO_ASSET_ID), "_blank")
    genericEvent("open cross-chain buy", { from: SWAP_MENU, asset: "tao" })
    closeIfEmbeddedPopup()
  }, [genericEvent])

  return <ContextMenuItem onClick={handleClick}>{t("Buy with USDC or ETH")}</ContextMenuItem>
}

/**
 * The home screen's Swap menu, shown instead of opening the website's swap when cross-chain sells
 * are on (`useIsCrossChainSellEnabled`): swap on Bittensor, sell TAO, or buy TAO.
 */
export const SwapActionMenuItems: FC = () => (
  <>
    <BittensorSwapMenuItem />
    <TaoSellMenuItem />
    <TaoBuyMenuItem />
  </>
)
