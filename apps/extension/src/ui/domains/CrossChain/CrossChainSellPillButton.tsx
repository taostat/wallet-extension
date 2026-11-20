import { Balances } from "@taostats-wallet/balances"
import { classNames } from "@taostats-wallet/util"
import { SwitchHorizontal01 } from "@untitledui/icons/SwitchHorizontal01"
import { FC, MouseEvent, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { Tooltip, TooltipContent, TooltipTrigger } from "taostats-ui"

import { useCrossChainSellModal } from "./useCrossChainSellModal"
import { useCrossChainSellOpenOptions } from "./useCrossChainSellOpenOptions"

/**
 * "Sell" on a portfolio holdings row, shown on hover next to Stake / Unstake: the same sell as
 * `CrossChainSellButton` (see `useCrossChainSellOpenOptions`), drawn like `StakePillButton`.
 *
 * `compact`: the icon alone, named by its label and tooltip, for rows that also show Unstake
 * (three text pills don't fit the popup's rows).
 */
export const CrossChainSellPillButton: FC<{
  balances: Balances
  compact?: boolean
  className?: string
}> = ({ balances, compact, className }) => {
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

  const pillClassName = classNames(
    "text-fg-brand rounded-sm bg-[#293c37] p-2 text-xs font-light hover:bg-[#214940]",
    className,
  )

  if (compact)
    return (
      <Tooltip placement="top">
        <TooltipTrigger asChild>
          <button
            className={pillClassName}
            type="button"
            onClick={handleClick}
            aria-label={t("Sell for USDC or ETH")}
          >
            <SwitchHorizontal01 className="shrink-0 text-base" />
          </button>
        </TooltipTrigger>
        <TooltipContent>{t("Sell for USDC or ETH")}</TooltipContent>
      </Tooltip>
    )

  return (
    <button className={pillClassName} type="button" onClick={handleClick}>
      <div className="flex items-center gap-1">
        <SwitchHorizontal01 className="shrink-0 text-base" />
        <div>{t("Sell")}</div>
      </div>
    </button>
  )
}
