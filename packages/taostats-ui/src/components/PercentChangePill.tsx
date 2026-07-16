import { classNames } from "@taostats-wallet/util"
import { ArrowDownLeft } from "@untitledui/icons/ArrowDownLeft"
import { ArrowUpRight } from "@untitledui/icons/ArrowUpRight"
import { FC } from "react"

type PercentChangePillProps = {
  /** Percentage points, e.g. `3.01` for +3.01%. */
  value: number | null | undefined
  className?: string
  /** Hide the directional arrow icon. */
  hideArrow?: boolean
}

/**
 * Green/red pill for percentage movement (price or holding change).
 * Matches monorepo `SubnetPercentChangePill` / `ValueChangePill` styling.
 */
export const PercentChangePill: FC<PercentChangePillProps> = ({
  value,
  className,
  hideArrow = false,
}) => {
  if (value === null || value === undefined || Number.isNaN(value)) return null

  const isPositive = value > 0
  const isNegative = value < 0
  const abs = Math.abs(value)

  return (
    <span
      className={classNames(
        "font-mono gap-xxs px-sm py-xxs inline-flex items-center rounded-full text-xs font-medium",
        isPositive && "bg-brand-secondary text-fg-brand",
        isNegative && "bg-accent-2/10 text-accent-2",
        !isPositive && !isNegative && "bg-secondary text-fg-tertiary",
        className,
      )}
    >
      {!hideArrow &&
        (isPositive ? (
          <ArrowUpRight className="size-3 shrink-0" />
        ) : isNegative ? (
          <ArrowDownLeft className="size-3 shrink-0" />
        ) : null)}
      {abs.toFixed(2)}%
    </span>
  )
}
