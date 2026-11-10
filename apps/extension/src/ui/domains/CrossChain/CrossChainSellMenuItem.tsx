import { Balances } from "@taostats-wallet/balances"
import { FC } from "react"
import { useTranslation } from "react-i18next"
import { ContextMenuItem } from "taostats-ui"

import { useCrossChainSellModal } from "./useCrossChainSellModal"
import { useCrossChainSellOpenOptions } from "./useCrossChainSellOpenOptions"

/** "Sell for USDC or ETH" in a token's menu: the same sell as `CrossChainSellButton`. */
export const CrossChainSellMenuItem: FC<{ balances: Balances }> = ({ balances }) => {
  const { t } = useTranslation()
  const { open } = useCrossChainSellModal()
  const openOptions = useCrossChainSellOpenOptions(balances)

  if (!openOptions) return null

  return (
    <ContextMenuItem onClick={() => open(openOptions)}>{t("Sell for USDC or ETH")}</ContextMenuItem>
  )
}
