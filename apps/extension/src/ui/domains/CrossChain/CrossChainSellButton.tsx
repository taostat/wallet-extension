import { Balances } from "@taostats-wallet/balances"
import { SwitchHorizontal01 } from "@untitledui/icons/SwitchHorizontal01"
import { FC, MouseEvent, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { Tooltip, TooltipContent, TooltipTrigger } from "taostats-ui"

import { useCrossChainSellModal } from "./useCrossChainSellModal"
import { useCrossChainSellOpenOptions } from "./useCrossChainSellOpenOptions"

/** "Sell for USDC or ETH" on an asset's token row, next to Stake (see `useCrossChainSellOpenOptions`). */
export const CrossChainSellButton: FC<{ balances: Balances }> = ({ balances }) => {
  const { t } = useTranslation()
  const { open } = useCrossChainSellModal()
  const openOptions = useCrossChainSellOpenOptions(balances)

  const handleClick = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation()
      if (openOptions) open(openOptions)
    },
    [open, openOptions],
  )

  if (!openOptions) return null

  return (
    <Tooltip placement="top">
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={handleClick}
          aria-label={t("Sell for USDC or ETH")}
          className="text-fg-brand bg-fg-brand/10 hover:bg-fg-brand/20 focus-visible:bg-fg-brand/20 flex shrink-0 items-center justify-center rounded-full p-1.5"
        >
          <SwitchHorizontal01 />
        </button>
      </TooltipTrigger>
      <TooltipContent>{t("Sell for USDC or ETH")}</TooltipContent>
    </Tooltip>
  )
}
