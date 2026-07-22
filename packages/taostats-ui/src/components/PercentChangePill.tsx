import { ArrowDownLeft } from "@untitledui/icons/ArrowDownLeft"
import { ArrowUpRight } from "@untitledui/icons/ArrowUpRight"
import { FC } from "react"

import { Pill, PillVariant } from "./Pill"

type PercentChangePillProps = {
  /** Percentage points, e.g. `3.01` for +3.01%. */
  value: number | null | undefined
  className?: string
  /** Hide the directional arrow icon. */
  hideArrow?: boolean
}

const getVariant = (value: number): PillVariant => {
  if (value > 0) return "positive"
  if (value < 0) return "negative"
  return "neutral"
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
    <Pill variant={getVariant(value)} mono className={className}>
      {!hideArrow &&
        (isPositive ? (
          <ArrowUpRight className="size-3 shrink-0" />
        ) : isNegative ? (
          <ArrowDownLeft className="size-3 shrink-0" />
        ) : null)}
      {abs.toFixed(2)}%
    </Pill>
  )
}
