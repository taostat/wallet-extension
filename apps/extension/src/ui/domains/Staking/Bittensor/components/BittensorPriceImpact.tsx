import { classNames } from "@taostats-wallet/util"
import { AlertTriangle } from "@untitledui/icons/AlertTriangle"
import { InfoCircle } from "@untitledui/icons/InfoCircle"
import { useTranslation } from "react-i18next"
import { Tooltip, TooltipContent, TooltipTrigger } from "taostats-ui"

import { useBittensorStakeWizard } from "../hooks/useBittensorStakeWizard"
import { getPriceImpactLevel } from "../utils/helpers"

/**
 * How much worse than the current price this swap fills on average, with a warning when it is large.
 * Price impact is known before signing, so it is shown up front and is separate from slippage tolerance,
 * which only covers the price moving after the user signs.
 */
export const BittensorPriceImpact = ({ withWarning = true }: { withWarning?: boolean }) => {
  const { t } = useTranslation()
  const { priceImpact } = useBittensorStakeWizard()

  if (typeof priceImpact !== "number") return null

  const level = getPriceImpactLevel(priceImpact)
  // Theme tokens: the shared Tailwind theme replaces the default orange scale, so
  // `text-orange-500` generates nothing and the text stays grey.
  const colorClassName = classNames(
    level === "high" && "text-fg-orange",
    level === "very-high" && "text-fg-error",
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
                "How much worse than the current price this trade fills on average. Each part of a trade moves the subnet's pool price for the next, so larger trades in smaller pools get a worse price.",
              )}
            </span>
          </TooltipContent>
        </Tooltip>
        <div className={classNames("text-fg-primary", colorClassName)}>
          {priceImpact.toFixed(2)}%
        </div>
      </div>
      {withWarning && level !== "normal" && (
        <div
          role="alert"
          className={classNames(
            "flex items-start gap-2 rounded border p-3 text-xs",
            level === "very-high"
              ? "border-fg-error/40 bg-error-secondary text-fg-error"
              : "border-fg-orange/40 bg-orange-secondary text-fg-orange",
          )}
        >
          <AlertTriangle className="mt-0.5 shrink-0" />
          <div className="flex flex-col gap-0.5">
            <div className="font-bold">{t("High price impact")}</div>
            <div>
              {level === "very-high"
                ? t(
                    "On average this trade fills at a price {{impact}}% worse than the current price. Consider a smaller amount.",
                    { impact: priceImpact.toFixed(2) },
                  )
                : t(
                    "On average this trade fills at a price {{impact}}% worse than the current price.",
                    { impact: priceImpact.toFixed(2) },
                  )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
