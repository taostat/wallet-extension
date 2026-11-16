import { cn } from "@taostats-wallet/util"
import { FC } from "react"
import { useTranslation } from "react-i18next"

import { IS_CROSS_CHAIN_SELL_BUILD, useIsCrossChainSellEnabled } from "./crossChainSellGate"
import { useCrossChainSellModal } from "./useCrossChainSellModal"

/**
 * "Recent cross-chain swaps" on the History pages: opens the list (and its recovery) in the sell
 * modal, mounted in the popup and the dashboard. Nothing with sells off (the build or our API).
 */
export const CrossChainRecentSwapsLink: FC<{ className?: string }> = ({ className }) =>
  IS_CROSS_CHAIN_SELL_BUILD ? <RecentSwapsLink className={className} /> : null

const RecentSwapsLink: FC<{ className?: string }> = ({ className }) => {
  const { t } = useTranslation()
  const isEnabled = useIsCrossChainSellEnabled()
  const { openRecent } = useCrossChainSellModal()
  if (!isEnabled) return null

  return (
    <button
      type="button"
      onClick={openRecent}
      className={cn("text-fg-secondary hover:text-fg-primary text-xs underline", className)}
    >
      {t("Recent cross-chain swaps")}
    </button>
  )
}
