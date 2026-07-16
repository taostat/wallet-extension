import { bind } from "@react-rxjs/core"
import { Balances } from "@taostats-wallet/balances"
import { TokenId } from "@taostats-wallet/chaindata-provider"
import { classNames, formatPrice } from "@taostats-wallet/util"
import { FC } from "react"
import { combineLatest, map } from "rxjs"
import { Tooltip, TooltipContent, TooltipTrigger } from "taostats-ui"

import { formatFiat } from "@taostats/util/formatFiat"
import { getTokenRates$, selectedCurrency$ } from "@ui/state"

const [useDisplayAssetPrice] = bind(
  (tokenId: TokenId | null | undefined, balances: Balances | null | undefined) =>
    combineLatest([getTokenRates$(tokenId), selectedCurrency$]).pipe(
      map(([rates, currency]) => {
        if (!tokenId) return null

        let rate = rates?.[currency]

        // some token rates aren't stored in the global token rates map (e.g. substrate-dtao tokens) and must be picked from balance object
        if (!rate && balances) rate = balances.find({ tokenId })?.each[0]?.rates?.[currency]

        if (!rate) return null

        // Holdings list: always show USD at 2dp; other currencies keep compact price formatting.
        const compact =
          currency === "usd"
            ? formatFiat(rate.price, "usd", "narrowSymbol", 2)
            : formatPrice(rate.price, currency, true)

        const full =
          currency === "usd"
            ? formatFiat(rate.price, "usd", "narrowSymbol", 2)
            : formatPrice(rate.price, currency, false)

        const rawChange24h = rate.change24h
          ? new Intl.NumberFormat(undefined, {
              minimumFractionDigits: 1,
              style: "percent",
              signDisplay: "always",
            }).format(rate.change24h / 100)
          : undefined

        // we dont want a sign (which is used for color check) if change displays as +0.0% or -0.0%
        const change24h = rawChange24h?.length
          ? rawChange24h.slice(1) === "0.0%"
            ? "0.0%"
            : rawChange24h
          : undefined

        const changeClassName = getPriceChangeClassName(change24h)

        return {
          compact,
          full,
          change24h,
          change24hValue: typeof rate.change24h === "number" ? rate.change24h : null,
          changeClassName,
        }
      }),
    ),
)

export { useDisplayAssetPrice }

export const AssetPrice: FC<{
  tokenId: TokenId | null | undefined
  balances: Balances | null | undefined
  as?: "div" | "span"
  className?: string
  priceClassName?: string
  changeClassName?: string
  noTooltip?: boolean
  noChange?: boolean
  /** Overrides the default tooltip (full price). */
  tooltipLabel?: string
}> = ({
  as: Container = "div",
  tokenId,
  balances,
  noTooltip,
  noChange,
  className,
  priceClassName,
  changeClassName,
  tooltipLabel,
}) => {
  const price = useDisplayAssetPrice(tokenId, balances)

  if (!price) return null

  return (
    <Tooltip placement="bottom-start">
      <TooltipTrigger asChild>
        <Container className={classNames("whitespace-nowrap", className)}>
          <span className={priceClassName}>{price.compact}</span>
          {!noChange && price.change24h ? (
            <span
              className={classNames(
                "text-xs", // smaller text for percentage change in asset lists
                price.changeClassName,
                changeClassName,
              )}
            >
              {price.change24h}
            </span>
          ) : null}
        </Container>
      </TooltipTrigger>
      {!noTooltip && <TooltipContent>{tooltipLabel ?? price.full}</TooltipContent>}
    </Tooltip>
  )
}

const getPriceChangeClassName = (change24h: string | undefined) => {
  switch (change24h?.[0]) {
    case "+":
      return "text-price-up"
    case "-":
      return "text-price-down"
    case "0": // 0.0%
      return "text-fg-tertiary"
    default:
      return null
  }
}
