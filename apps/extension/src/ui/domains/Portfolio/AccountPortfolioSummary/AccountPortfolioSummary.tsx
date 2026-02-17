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
import { formatNumber } from "./utils"

const StatCardContainer: FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="bg-grey-850 flex flex-grow flex-col gap-4 rounded-lg p-6">{children}</div>
)

const Skeleton: FC<{ className?: string }> = ({ className }) => (
  <div className={classNames("bg-grey-700 h-10 w-32 animate-pulse rounded", className)} />
)

const SelectorButton: FC<{
  isSelected: boolean
  onClick: () => void
  children: React.ReactNode
  className?: string
}> = ({ isSelected, onClick, children, className = "px-2.5 py-1" }) => (
  <button
    type="button"
    className={classNames(
      "rounded-lg border text-sm transition-colors",
      isSelected
        ? "border-accent-1 bg-accent-1/10 text-white"
        : "border-[#323232] bg-[#1D1D1D] text-white/60 hover:bg-emerald-500/20 hover:text-white",
      className,
    )}
    onClick={onClick}
  >
    {children}
  </button>
)

const portfolioDateRanges = [
  { label: "1D", value: "1d" },
  { label: "1W", value: "1w" },
  { label: "1M", value: "1m" },
  { label: "1Y", value: "1y" },
] as const

const DateRangeSelector: FC<{
  dateRangeSelected: string
  onDateRangeChange: (value: string) => void
}> = ({ dateRangeSelected, onDateRangeChange }) => (
  <div className="flex gap-2">
    {portfolioDateRanges.map((range) => (
      <SelectorButton
        key={range.value}
        isSelected={dateRangeSelected === range.value}
        onClick={() => onDateRangeChange(range.value)}
      >
        {range.label}
      </SelectorButton>
    ))}
  </div>
)

const CurrencySelector: FC = () => {
  const currency = useSelectedCurrency()
  const [, setCurrency] = useSetting("selectedCurrency")

  return (
    <div className="flex gap-2">
      {(["tao", "usd"] as const).map((opt) => (
        <SelectorButton
          key={opt}
          isSelected={currency === opt}
          onClick={() => setCurrency(opt)}
          className="px-3 py-1.5"
        >
          {currencyConfig[opt]?.symbol ?? opt.toUpperCase()}
        </SelectorButton>
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
  <StatCardContainer>
    <div className="text-body-secondary text-sm">{title}</div>
    <div className="flex flex-1 flex-col justify-between gap-2">
      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: skeletonRows }).map((_, i) => (
            <Skeleton key={i} />
          ))}
        </div>
      ) : (
        <>
          <div className="text-lg font-normal">{value}</div>
          {footer && <div className="text-body-secondary text-xs">{footer}</div>}
        </>
      )}
    </div>
  </StatCardContainer>
)

type EarningsCardProps = {
  isLoading: boolean
  isValidatorYieldLoading?: boolean
  totalEarningsTao: number
  totalEarningsUsd: number
  overallYieldPercentage: number | null
}

const EarningsCard: FC<EarningsCardProps> = ({
  isLoading,
  isValidatorYieldLoading = false,
  totalEarningsTao,
  totalEarningsUsd,
  overallYieldPercentage,
}) => {
  const { t } = useTranslation()
  const showApyValue = !isValidatorYieldLoading

  return (
    <StatCardContainer>
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
          <Skeleton />
          <Skeleton className="!w-20" />
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
          <div className="flex min-w-[4rem] flex-col items-start justify-start">
            {showApyValue ? (
              <span className="text-body-secondary text-[0.85rem] font-light text-white/60">
                {overallYieldPercentage != null
                  ? `${formatNumber(overallYieldPercentage)}% APY`
                  : "—"}
              </span>
            ) : (
              <Skeleton className="!h-5 !w-16" />
            )}
          </div>
        </div>
      )}
    </StatCardContainer>
  )
}

export const AccountPortfolioSummary: FC = () => {
  const { selectedAccount } = usePortfolioNavigation()
  const { t } = useTranslation()
  const [dateRangeSelected, setDateRangeSelected] = useAtom(portfolioDateRangeAtom)
  const address = selectedAccount?.address

  const {
    isLoading,
    isValidatorYieldLoading,
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
              isValidatorYieldLoading={isValidatorYieldLoading}
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
