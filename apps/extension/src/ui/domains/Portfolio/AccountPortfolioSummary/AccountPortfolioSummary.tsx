import { InfoIcon } from "@taostats-wallet/icons"
import { classNames } from "@taostats-wallet/util"
import { useAtom } from "jotai"
import { FC, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Tooltip, TooltipContent, TooltipTrigger } from "taostats-ui"

import { currencyConfig } from "@ui/domains/Asset/currencyConfig"
import { Tokens } from "@ui/domains/Asset/Tokens"
import { portfolioDateRangeAtom, useSelectedCurrency, useSetting } from "@ui/state"

import { usePortfolioNavigation } from "../usePortfolioNavigation"
import { EarningsChart } from "./EarningsChart/EarningsChart"
import { useAccountPortfolioData } from "./useAccountPortfolioData"

const formatNumber = (n: number, decimals = 2) =>
  n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

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
  isLoading?: boolean
  skeletonRows?: number
}

const StatCard: FC<StatCardProps> = ({ title, value, footer, isLoading, skeletonRows = 1 }) => (
  <div className="bg-grey-850 flex flex-grow flex-col gap-4 rounded-lg p-6">
    <div className="text-body-secondary text-sm">{title}</div>
    <div className="flex flex-1 flex-col justify-between gap-2">
      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: skeletonRows }).map((_, i) => (
            <div key={i} className="bg-grey-700 h-10 w-32 animate-pulse rounded" />
          ))}
        </div>
      ) : (
        <>
          <div className="text-lg font-normal">{value}</div>
          {footer && <div className="text-body-secondary text-xs">{footer}</div>}
        </>
      )}
    </div>
  </div>
)

type EarningsCardProps = {
  isLoading: boolean
  totalEarningsTao: number
  totalEarningsUsd: number
  overallYieldPercentage: number | null
}

const EarningsCard: FC<EarningsCardProps> = ({
  isLoading,
  totalEarningsTao,
  totalEarningsUsd,
  overallYieldPercentage,
}) => {
  const { t } = useTranslation()
  return (
    <div className="bg-grey-850 flex flex-grow flex-col gap-4 rounded-lg p-6">
      {/* Header row: Earnings (left) | Staking APY (right) */}
      <div className="flex flex-row justify-between">
        <span className="text-body-secondary text-sm">{t("Earnings")}</span>
        <div className="flex flex-row items-center justify-end gap-1">
          <span className="text-body-secondary text-sm">{t("Staking APY")}</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help">
                <InfoIcon className="text-body-secondary ml-1 inline text-white/60" />
              </span>
            </TooltipTrigger>
            <TooltipContent>{t("The weighted APY of your staking positions.")}</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Content row: left = earnings, right = APY */}
      {isLoading ? (
        <div className="flex flex-row justify-between gap-4">
          <div className="bg-grey-700 h-10 w-32 animate-pulse rounded" />
          <div className="bg-grey-700 h-10 w-20 animate-pulse rounded" />
        </div>
      ) : (
        <div className="flex flex-row justify-between">
          <div className="flex flex-col gap-2">
            <div className="text-lg font-normal">
              <Tokens amount={totalEarningsTao} symbol="TAO" isBalance />
            </div>
            <div className="text-body-secondary text-base text-white/60">
              ${formatNumber(totalEarningsUsd)}
            </div>
          </div>
          <div className="flex flex-col items-start justify-start">
            <span className="text-body-secondary text-sm font-light text-white/60">
              {overallYieldPercentage != null
                ? `${formatNumber(overallYieldPercentage)}% APY`
                : "—"}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export const AccountPortfolioSummary: FC = () => {
  const { selectedAccount } = usePortfolioNavigation()
  const { t } = useTranslation()
  const [dateRangeSelected, setDateRangeSelected] = useAtom(portfolioDateRangeAtom)
  const address = selectedAccount?.address

  const {
    isLoading,
    isError,
    totalEarningsTao,
    totalEarningsUsd,
    overallYieldPercentage,
    realisedProfitTao,
    realisedProfitUsd,
    unrealisedProfitTao,
    unrealisedProfitUsd,
    rank,
    accountsTotal,
    rankPercentage,
    coldkeyData,
    balanceTotalTao,
  } = useAccountPortfolioData(address, dateRangeSelected)

  const currency = useSelectedCurrency()
  const gainsValue = useMemo(() => {
    if (isLoading) return "…"
    const rows: { label: string; tao: number; usd: number; colour: "green" | "red" }[] = [
      { label: t("Realised"), tao: realisedProfitTao, usd: realisedProfitUsd, colour: "green" },
      {
        label: t("Unrealised"),
        tao: unrealisedProfitTao,
        usd: unrealisedProfitUsd,
        colour: "red",
      },
    ]
    return (
      <table className="w-full table-auto">
        <tbody>
          {rows.map(({ label, tao, usd, colour }) => (
            <tr key={label}>
              <td className="w-auto pr-3 align-middle">
                <div className="flex items-center">
                  <div
                    className={classNames(
                      "mr-2 h-2 w-2 shrink-0 rounded-full",
                      colour === "green" ? "bg-accent-1" : "bg-accent-2",
                    )}
                  />
                  <span className="text-body-secondary text-sm text-white/60">{label}</span>
                </div>
              </td>
              <td className="w-full min-w-0 whitespace-nowrap align-middle">
                <div className="flex items-center justify-end">
                  <span className="text-sm">
                    {currency === "tao" ? (
                      <Tokens amount={tao} symbol="TAO" isBalance className="text-white" />
                    ) : (
                      <span className="text-white">${formatNumber(usd)}</span>
                    )}
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }, [
    isLoading,
    realisedProfitTao,
    realisedProfitUsd,
    unrealisedProfitTao,
    unrealisedProfitUsd,
    currency,
    t,
  ])

  const rankValue = useMemo(() => {
    if (isLoading) return "…"
    const rankStr = rank.toLocaleString()
    const totalStr = accountsTotal.toLocaleString()
    return (
      <>
        {rankStr}
        <span className="text-body-secondary text-[0.7em]"> / {totalStr}</span>
      </>
    )
  }, [isLoading, rank, accountsTotal])

  const rankFooter = useMemo(() => {
    if (accountsTotal <= 0) return undefined
    return rankPercentage < 5
      ? `You're in the top ${formatNumber(rankPercentage, 3)}% of Tao owners`
      : `You're in the top ${Math.round(rankPercentage)}% of Tao owners`
  }, [accountsTotal, rankPercentage])

  // Only show when a single account is selected (after all hooks)
  if (!selectedAccount) return null

  return (
    <div className="flex flex-col gap-6">
      {/* Main: Two columns - left stats, right chart */}
      <div className="flex flex-col gap-6 sm:flex-row">
        {/* Left column: Stats cards stacked vertically */}
        <div className="flex-shrink-0 sm:w-[350px]">
          <div className="flex flex-col gap-6">
            <EarningsCard
              isLoading={isLoading}
              totalEarningsTao={totalEarningsTao}
              totalEarningsUsd={totalEarningsUsd}
              overallYieldPercentage={overallYieldPercentage}
            />
            <StatCard
              title={t("Gains")}
              value={gainsValue}
              isLoading={isLoading}
              skeletonRows={2}
            />
            <StatCard
              title={t("Wallet Rank")}
              value={rankValue}
              footer={rankFooter}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Right column: Chart with date range + currency below */}
        <div className="flex min-h-[250px] min-w-[300px] flex-1 flex-col gap-4 overflow-hidden">
          <EarningsChart
            coldkeyData={coldkeyData}
            balanceTotalTao={balanceTotalTao}
            isLoading={isLoading}
            isError={isError}
          />
          <div className="flex flex-row flex-wrap items-center justify-end gap-4">
            <DateRangeSelector
              dateRangeSelected={dateRangeSelected}
              onDateRangeChange={(v) => setDateRangeSelected(v as "1d" | "1w" | "1m" | "1y")}
            />
            <CurrencySelector />
          </div>
        </div>
      </div>
    </div>
  )
}
