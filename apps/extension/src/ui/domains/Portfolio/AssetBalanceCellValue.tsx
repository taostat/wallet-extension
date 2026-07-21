import { classNames } from "@taostats-wallet/util"
import { Lock01 } from "@untitledui/icons/Lock01"
import BigNumber from "bignumber.js"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { PercentChangePill, Tooltip, TooltipContent, TooltipTrigger } from "taostats-ui"

import { BalancesStatus } from "@ui/hooks/useBalancesStatus"
import { useSelectedCurrency } from "@ui/state"

import { BalanceSeparator } from "../Asset/BalanceSeparator"
import { currencyConfig } from "../Asset/currencyConfig"
import { Fiat } from "../Asset/Fiat"
import { Tokens } from "../Asset/Tokens"
import { StaleBalancesIcon } from "./StaleBalancesIcon"
import { isAlphaSymbol, isRootTaoHolding, isRootTaoSymbol } from "./isRootTaoHolding"

type Props = {
  locked?: boolean
  tokens: BigNumber | number
  fiat: number | null
  symbol: string
  /** Root / native TAO (netuid 0 or substrate-native TAO). */
  isRootTao?: boolean
  /** 24h price change in percentage points (e.g. 3.01 for +3.01%). */
  change24hPct?: number | null
  /** Tooltip for the tokens / fiat line (e.g. locked / available labels). */
  tooltip?: string
  render?: boolean
  className?: string
  /** Applied to the primary token / fiat amount line. */
  amountClassName?: string
  balancesStatus?: BalancesStatus
  noCountUp?: boolean
}

export const AssetBalanceCellValue = ({
  locked,
  tokens,
  fiat,
  symbol,
  isRootTao,
  change24hPct,
  tooltip,
  render = true,
  className,
  amountClassName,
  balancesStatus,
  noCountUp,
}: Props) => {
  const { t } = useTranslation()
  const currency = useSelectedCurrency()

  const holdingChange = useMemo(() => {
    if (fiat === null || typeof change24hPct !== "number") return null
    // Same convention as Balances.change24h: Δ ≈ value_now × pct / 100
    return (fiat * change24hPct) / 100
  }, [fiat, change24hPct])

  if (!render) return null

  const isRootTaoBalance = isRootTao || isRootTaoSymbol(symbol)
  const showTaoFiatOnly = isRootTaoBalance && currency === "tao"
  const showSecondaryValue = fiat !== null && !showTaoFiatOnly

  const balanceLine = (
    <div
      className={classNames(
        "flex items-center justify-end gap-1",
        amountClassName,
        locked ? "text-fg-secondary" : "text-fg-primary",
      )}
    >
      <div className="flex items-baseline gap-1">
        {showTaoFiatOnly ? (
          <Fiat
            amount={fiat ?? (BigNumber.isBigNumber(tokens) ? tokens.toNumber() : tokens)}
            isBalance
            noCountUp={noCountUp}
            forceCurrency="tao"
          />
        ) : (
          <>
            <Tokens
              amount={tokens}
              symbol={isRootTaoBalance ? currencyConfig.tao.symbol : symbol}
              isBalance
              noCountUp={noCountUp}
              noSpaceBeforeSymbol
              symbolBeforeAmount={isRootTaoBalance || isAlphaSymbol(symbol)}
            />
            {showSecondaryValue && (
              <>
                <BalanceSeparator />
                <Fiat
                  amount={fiat}
                  isBalance
                  noCountUp={noCountUp}
                  forceCurrency={isRootTaoBalance ? "usd" : undefined}
                />
              </>
            )}
          </>
        )}
      </div>
      {locked ? (
        <div className="pb-0.5">
          <Lock01 className="lock" />
        </div>
      ) : null}
      {balancesStatus?.status === "stale" ? (
        <div className="pb-0.5">
          <StaleBalancesIcon staleChains={balancesStatus.staleChains} />
        </div>
      ) : null}
    </div>
  )

  return (
    <div
      className={classNames(
        "flex h-[66px] flex-col justify-center gap-1 whitespace-nowrap py-4 text-right",
        className,
      )}
    >
      {tooltip ? (
        <Tooltip placement="bottom-end">
          <TooltipTrigger asChild>
            <div>{balanceLine}</div>
          </TooltipTrigger>
          <TooltipContent>{tooltip}</TooltipContent>
        </Tooltip>
      ) : (
        balanceLine
      )}

      {holdingChange !== null &&
        typeof change24hPct === "number" &&
        (holdingChange !== 0 || change24hPct !== 0) && (
          <Tooltip placement="bottom-end">
            <TooltipTrigger asChild>
              {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
              <div
                className="flex items-center justify-end gap-1.5"
                onClick={(e) => e.stopPropagation()}
              >
                <span
                  className={classNames(
                    "inline-flex items-baseline font-mono text-xs",
                    holdingChange > 0 && "text-fg-brand",
                    holdingChange < 0 && "text-accent-2",
                    holdingChange === 0 && "text-fg-tertiary",
                  )}
                >
                  {holdingChange > 0 && <span aria-hidden>+</span>}
                  {holdingChange < 0 && <span aria-hidden>-</span>}
                  <Fiat
                    amount={Math.abs(holdingChange)}
                    isBalance
                    noCountUp
                    compactLessThan
                    forceCurrency={currency}
                  />
                </span>
                <PercentChangePill value={change24hPct} />
              </div>
            </TooltipTrigger>
            <TooltipContent>{t("Holding Change 1D")}</TooltipContent>
          </Tooltip>
        )}
    </div>
  )
}
