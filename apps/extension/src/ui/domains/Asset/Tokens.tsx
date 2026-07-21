import { classNames, formatDecimals, MAX_DECIMALS_FORMAT } from "@taostats-wallet/util"
import BigNumber from "bignumber.js"
import React, { FC, useMemo } from "react"
import CountUp from "react-countup"
import { Tooltip, TooltipContent, TooltipTrigger } from "taostats-ui"

import { useRevealableBalance } from "@ui/hooks/useRevealableBalance"

type TokensProps = {
  amount?: string | number | null | BigNumber
  symbol?: string | null
  decimals?: number | null
  className?: string
  as?: "span" | "div"
  noTooltip?: boolean
  noCountUp?: boolean
  isBalance?: boolean
  /** Omit the space between the amount and symbol (e.g. `12.3α`). */
  noSpaceBeforeSymbol?: boolean
  /** Render symbol before the amount (e.g. `α12.3`). */
  symbolBeforeAmount?: boolean
}

type DisplayValueProps = {
  amount: string | number | BigNumber
  symbol?: string | null
  noCountUp?: boolean
  noSpaceBeforeSymbol?: boolean
  symbolBeforeAmount?: boolean
}

// Memoize to smooth up the count up animation
const DisplayValue: FC<DisplayValueProps> = React.memo(
  ({ amount, symbol, noCountUp, noSpaceBeforeSymbol, symbolBeforeAmount }) => {
    const num = useMemo(
      () => (BigNumber.isBigNumber(amount) ? amount.toNumber() : Number(amount)),
      [amount],
    )

    const formated = useMemo(() => formatDecimals(num), [num])
    const gap = noSpaceBeforeSymbol ? "" : " "
    const formattedAmount = noCountUp || formated.startsWith("<") ? formated : null

    if (isNaN(num)) return null

    if (formattedAmount !== null) {
      return (
        <>
          {symbolBeforeAmount ? `${symbol ?? ""}${gap}${formattedAmount}` : `${formattedAmount}${gap}${symbol ?? ""}`}
        </>
      )
    }

    if (symbolBeforeAmount) {
      return (
        <>
          {symbol ?? ""}
          {gap}
          <CountUp
            end={num}
            decimals={num >= 1000 ? 0 : (formated.split(".")[1]?.length ?? 0)} // define the decimals based on the formatted number
            decimal="."
            separator=","
            duration={0.4}
            formattingFn={formatDecimals}
            useEasing
            preserveValue
          />
        </>
      )
    }

    return (
      <>
        <CountUp
          end={num}
          decimals={num >= 1000 ? 0 : (formated.split(".")[1]?.length ?? 0)} // define the decimals based on the formatted number
          decimal="."
          separator=","
          duration={0.4}
          formattingFn={formatDecimals}
          useEasing
          preserveValue
        />
        {gap}
        {symbol ?? ""}
      </>
    )
  },
)
DisplayValue.displayName = "DisplayValue"

export const Tokens: FC<TokensProps> = ({
  amount,
  symbol,
  decimals,
  className,
  as: Component = "span",
  noTooltip,
  noCountUp,
  isBalance = false,
  noSpaceBeforeSymbol,
  symbolBeforeAmount,
}) => {
  const { refReveal, isRevealable, isRevealed, isHidden, effectiveNoCountUp } =
    useRevealableBalance(isBalance, noCountUp)

  const tooltipAmount = useMemo(() => {
    const gap = noSpaceBeforeSymbol ? "" : " "
    const formatted = formatDecimals(amount, decimals ?? MAX_DECIMALS_FORMAT, {
      notation: "standard",
    })
    return symbolBeforeAmount
      ? `${symbol ?? ""}${gap}${formatted}`.trim()
      : `${formatted}${gap}${symbol ?? ""}`.trim()
  }, [amount, decimals, noSpaceBeforeSymbol, symbol, symbolBeforeAmount])
  const tooltip = useMemo(() => (noTooltip ? null : tooltipAmount), [noTooltip, tooltipAmount])

  const render = amount !== null && amount !== undefined

  return (
    <Component
      ref={refReveal}
      className={classNames(
        "tokens",
        isRevealable && "balance-revealable",
        isRevealed && "balance-reveal",
        className,
      )}
    >
      {render && (
        <Tooltip placement="bottom-end">
          <TooltipTrigger asChild>
            <span data-amount={tooltipAmount}>
              <DisplayValue
                amount={isHidden ? 0 : amount}
                symbol={symbol}
                noCountUp={effectiveNoCountUp}
                noSpaceBeforeSymbol={noSpaceBeforeSymbol}
                symbolBeforeAmount={symbolBeforeAmount}
              />
            </span>
          </TooltipTrigger>
          {tooltip && <TooltipContent>{tooltip}</TooltipContent>}
        </Tooltip>
      )}
    </Component>
  )
}
