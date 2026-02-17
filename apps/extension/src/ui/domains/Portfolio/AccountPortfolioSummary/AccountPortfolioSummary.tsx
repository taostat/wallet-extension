import { ExternalLinkIcon } from "@taostats-wallet/icons"
import { classNames } from "@taostats-wallet/util"
import { FC, useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "taostats-ui"

import { Tokens } from "@ui/domains/Asset/Tokens"
import { currencyConfig } from "@ui/domains/Asset/currencyConfig"
import { useSelectedCurrency, useSetting } from "@ui/state"
import { TAOSTATS_WEB_APP_DOMAIN } from "extension-shared"

import { usePortfolioNavigation } from "../usePortfolioNavigation"
import { EarningsChart } from "./EarningsChart/EarningsChart"
import { useAccountPortfolioData } from "./useAccountPortfolioData"

const DASHBOARD_PORTFOLIO_URL = `https://dash.${TAOSTATS_WEB_APP_DOMAIN}/portfolio`

const portfolioDateRanges = [
  { label: "1D", value: "1d" },
  { label: "1W", value: "1w" },
  { label: "1M", value: "1m" },
  { label: "1Y", value: "1y" },
] as const

const DateRangeSelector: FC<{
  dateRangeSelected: string
  onDateRangeChange: (value: string) => void
}> = ({ dateRangeSelected, onDateRangeChange }) => {
  return (
    <div className="flex gap-2">
      {portfolioDateRanges.map((range) => (
        <button
          type="button"
          key={range.value}
          className={classNames(
            "rounded-lg border px-2.5 py-1 text-sm transition-colors",
            dateRangeSelected === range.value
              ? "border-accent-1 bg-accent-1/10 text-white"
              : "border-[#323232] bg-[#1D1D1D] text-white/60 hover:bg-emerald-500/20 hover:text-white",
          )}
          onClick={() => onDateRangeChange(range.value)}
        >
          {range.label}
        </button>
      ))}
    </div>
  )
}

const CurrencySelector: FC = () => {
  const currency = useSelectedCurrency()
  const [, setCurrency] = useSetting("selectedCurrency")

  return (
    <div className="flex gap-2">
      {(["tao", "usd"] as const).map((opt) => (
        <button
          key={opt}
          type="button"
          className={classNames(
            "rounded-lg border px-3 py-1.5 text-sm transition-colors",
            currency === opt
              ? "border-accent-1 bg-accent-1/10 text-white"
              : "border-[#323232] bg-[#1D1D1D] text-white/60 hover:bg-emerald-500/20 hover:text-white",
          )}
          onClick={() => setCurrency(opt)}
        >
          {currencyConfig[opt]?.symbol ?? opt.toUpperCase()}
        </button>
      ))}
    </div>
  )
}

type StatCardProps = {
  title: string
  value: React.ReactNode
  footer?: React.ReactNode
  viewOnTaostats?: boolean
  address?: string
}

const StatCard: FC<StatCardProps> = ({
  title,
  value,
  footer,
  viewOnTaostats = false,
  address,
}) => {
  const { t } = useTranslation()
  const handleViewOnTaostats = useCallback(() => {
    if (address) window.open(`${DASHBOARD_PORTFOLIO_URL}/${address}`, "_blank")
  }, [address])

  return (
    <div className="bg-grey-800 flex flex-grow flex-col gap-4 rounded-lg p-6">
      <div className="text-body-secondary text-sm">{title}</div>
      <div className="flex flex-1 flex-col justify-between gap-2">
        <div className="text-2xl font-normal">{value}</div>
        {footer && <div className="text-body-secondary text-xs">{footer}</div>}
        {viewOnTaostats && address && (
          <Button
            small
            onClick={handleViewOnTaostats}
            className="mt-2 flex w-fit items-center gap-2"
          >
            <ExternalLinkIcon className="text-sm" />
            {t("View on Taostats")}
          </Button>
        )}
      </div>
    </div>
  )
}

const formatNumber = (n: number, decimals = 2) =>
  n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

export const AccountPortfolioSummary: FC = () => {
  const { selectedAccount } = usePortfolioNavigation()
  const { t } = useTranslation()
  const [dateRangeSelected, setDateRangeSelected] = useState<"1d" | "1w" | "1m" | "1y">("1d")
  const address = selectedAccount?.address

  const {
    isLoading,
    isError,
    totalEarningsTao,
    totalEarningsUsd,
    gainsTao,
    gainsPercent,
    rank,
    accountsTotal,
    rankPercentage,
    coldkeyData,
    balanceTotalTao,
  } = useAccountPortfolioData(address, dateRangeSelected)

  const earningsValue = useMemo(() => {
    if (isLoading) return "…"
    return (
      <>
        <Tokens amount={totalEarningsTao} symbol="TAO" isBalance />
        <span className="text-body-secondary ml-1 text-sm">
          (${formatNumber(totalEarningsUsd)})
        </span>
      </>
    )
  }, [isLoading, totalEarningsTao, totalEarningsUsd])

  const gainsValue = useMemo(() => {
    if (isLoading) return "…"
    return (
      <>
        <Tokens
          amount={gainsTao}
          symbol="TAO"
          isBalance
          className={gainsTao >= 0 ? "text-accent-1" : "text-accent-2"}
        />
        <span
          className={classNames(
            "ml-1 text-sm",
            gainsPercent >= 0 ? "text-accent-1" : "text-accent-2",
          )}
        >
          ({gainsPercent >= 0 ? "+" : ""}
          {formatNumber(gainsPercent)}%)
        </span>
      </>
    )
  }, [isLoading, gainsTao, gainsPercent])

  const rankValue = useMemo(() => {
    if (isLoading) return "…"
    const rankStr = rank.toLocaleString()
    const totalStr = accountsTotal.toLocaleString()
    return (
      <>
        {rankStr}
        <span className="text-body-secondary text-lg"> / {totalStr}</span>
      </>
    )
  }, [isLoading, rank, accountsTotal])

  const rankFooter = useMemo(() => {
    if (accountsTotal <= 0) return undefined
    return rankPercentage < 5
      ? `Top ${formatNumber(rankPercentage, 3)}% of TAO owners`
      : `Top ${Math.round(rankPercentage)}% of TAO owners`
  }, [accountsTotal, rankPercentage])

  // Only show when a single account is selected (after all hooks)
  if (!selectedAccount) return null

  return (
    <div className="flex flex-col gap-6">
      {/* Date range and currency row - matches dashboard layout */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <DateRangeSelector
          dateRangeSelected={dateRangeSelected}
          onDateRangeChange={(v) => setDateRangeSelected(v as "1d" | "1w" | "1m" | "1y")}
        />
        <CurrencySelector />
      </div>

      {/* Stats row - Earnings, Gains, Rank cards */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <StatCard
          title={t("Earnings")}
          value={earningsValue}
          footer={t("Staking APY — weighted average")}
          viewOnTaostats
          address={address}
        />
        <StatCard
          title={t("Gains")}
          value={gainsValue}
          footer={t("Price change in selected period")}
          viewOnTaostats
          address={address}
        />
        <StatCard
          title={t("Wallet Rank")}
          value={rankValue}
          footer={rankFooter}
          viewOnTaostats
          address={address}
        />
      </div>

      {/* Earnings chart area - dual axis TAO (green) / USD (red) matching dashboard */}
      <div className="min-w-0 flex-1">
        <EarningsChart
          coldkeyData={coldkeyData}
          balanceTotalTao={balanceTotalTao}
          isLoading={isLoading}
          isError={isError}
        />
      </div>
    </div>
  )
}
