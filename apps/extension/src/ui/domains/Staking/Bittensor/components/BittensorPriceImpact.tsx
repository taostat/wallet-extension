import { classNames } from "@taostats-wallet/util"
import { AlertTriangle } from "@untitledui/icons/AlertTriangle"
import { InfoCircle } from "@untitledui/icons/InfoCircle"
import { useTranslation } from "react-i18next"
import { Tooltip, TooltipContent, TooltipTrigger } from "taostats-ui"

import { useBittensorStakeWizard } from "../hooks/useBittensorStakeWizard"
import { getPriceImpactLevel } from "../utils/helpers"

/**
 * How far this swap moves the subnet pool price, with a warning when it is large.
 * Price impact is known before signing, so it is shown up front and is separate from slippage tolerance,
 * which only covers the price moving after the user signs.
 */
export const BittensorPriceImpact = ({ withWarning = true }: { withWarning?: boolean }) => {
  const { t } = useTranslation()
  const { priceImpact } = useBittensorStakeWizard()

  if (typeof priceImpact !== "number") return null

  const level = getPriceImpactLevel(priceImpact)
  const colorClassName = classNames(
    level === "high" && "text-orange-500",
    level === "very-high" && "text-red-500",
  )

  return (
    <>
      <div className="flex items-center justify-between gap-4 text-xs">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-0.5 whitespace-nowrap">
              {t("Price Impact")}
              <InfoCircle />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <span className="block max-w-[260px]">
              {t(
                "How far this trade moves the subnet's pool price. Larger trades in smaller pools move the price more, so you receive less per token.",
              )}
            </span>
          </TooltipContent>
        </Tooltip>
        <div className={classNames("text-fg-primary", colorClassName)}>
          {priceImpact.toFixed(2)}%
        </div>
      </div>
      {withWarning && level !== "normal" && (
        <div className={classNames("flex items-start gap-1 text-xs", colorClassName)}>
          <AlertTriangle className="mt-0.5 shrink-0" />
          <div>
            {level === "very-high"
              ? t(
                  "Very high price impact. This trade moves the pool price by {{impact}}%, so you will receive much less than at the current price. Consider a smaller amount.",
                  { impact: priceImpact.toFixed(2) },
                )
              : t(
                  "High price impact. This trade moves the pool price by {{impact}}%, so you will receive less than at the current price.",
                  { impact: priceImpact.toFixed(2) },
                )}
          </div>
        </div>
      )}
    </>
  )
}
