import { classNames } from "@taostats-wallet/util"
import { InfoCircle } from "@untitledui/icons/InfoCircle"
import { LinkExternal01 } from "@untitledui/icons/LinkExternal01"
import { Trophy01 } from "@untitledui/icons/Trophy01"
import { getAccountGenesisHash } from "extension-core"
import { useAtom } from "jotai"
import { FC, ReactNode, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { SurfaceCard, Tooltip, TooltipContent, TooltipTrigger } from "taostats-ui"

import { CopyAddressIconButton } from "@taostats/components/CopyAddressIconButton"
import { formatFiat } from "@taostats/util/formatFiat"
import { shortenAddress } from "@taostats/util/shortenAddress"
import { currencyConfig } from "@ui/domains/Asset/currencyConfig"
import { useViewOnExplorer } from "@ui/domains/ViewOnExplorer"
import {
  portfolioDateRangeAtom,
  useSelectedCurrency,
  useSetting,
  useTokenRatesMap,
} from "@ui/state"

import { usePortfolioNavigation } from "../usePortfolioNavigation"
import { EarningsChart } from "./EarningsChart/EarningsChart"
import { useAccountPortfolioData } from "./useAccountPortfolioData"
import { formatNumber } from "./utils"

const TAO_TOKEN_ID = "bittensor:substrate-dtao:0"

const Skeleton: FC<{ className?: string }> = ({ className }) => (
  <div className={classNames("bg-tertiary h-5 w-16 animate-pulse rounded", className)} />
)

const SelectorButton: FC<{
  isSelected: boolean
  onClick: () => void
  children: ReactNode
  className?: string
}> = ({ isSelected, onClick, children, className = "px-1.5 py-0.5" }) => (
  <button
    type="button"
    className={classNames(
      "rounded-md border text-xs transition-colors",
      isSelected
        ? "border-fg-brand bg-fg-brand/10 text-fg-primary"
        : "border-primary text-fg-tertiary hover:text-fg-primary hover:bg-tertiary/50",
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
  <div className="flex gap-1">
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
    <div className="flex gap-1">
      {(["tao", "usd"] as const).map((opt) => (
        <SelectorButton key={opt} isSelected={currency === opt} onClick={() => setCurrency(opt)}>
          {currencyConfig[opt]?.symbol ?? opt.toUpperCase()}
        </SelectorButton>
      ))}
    </div>
  )
}

const StatCard: FC<{
  title: ReactNode
  titleRight?: ReactNode
  children: ReactNode
  className?: string
}> = ({ title, titleRight, children, className }) => (
  <SurfaceCard className={classNames("flex flex-col gap-4 p-4", className)}>
    <div className="flex items-center justify-between gap-2">
      <div className="text-fg-tertiary text-sm font-medium">{title}</div>
      {titleRight ? <div className="text-fg-tertiary text-sm">{titleRight}</div> : null}
    </div>
    {children}
  </SurfaceCard>
)

const formatTaoAmount = (amount: number) =>
  `${currencyConfig.tao.symbol}${formatFiat(amount, undefined, undefined, 2)}`

const formatUsdAmount = (amount: number) => `$${formatNumber(amount)}`

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

  return (
    <StatCard
      title={t("Total Earnings")}
      titleRight={
        <div className="flex items-center gap-1">
          <span>{t("Staking APY")}</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help">
                <InfoCircle className="text-fg-tertiary size-3.5" />
              </span>
            </TooltipTrigger>
            <TooltipContent>{t("The weighted APY of your staking positions.")}</TooltipContent>
          </Tooltip>
        </div>
      }
    >
      {isLoading ? (
        <div className="flex justify-between gap-2">
          <Skeleton />
          <Skeleton className="!w-14" />
        </div>
      ) : (
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <div className="text-fg-primary text-xl font-medium">
              {formatTaoAmount(totalEarningsTao)}
            </div>
            <div className="text-fg-tertiary text-sm">{formatUsdAmount(totalEarningsUsd)}</div>
          </div>
          <div className="text-fg-brand text-xl font-medium">
            {isValidatorYieldLoading ? (
              <Skeleton className="!h-6 !w-14" />
            ) : overallYieldPercentage != null ? (
              `${formatNumber(overallYieldPercentage)}%`
            ) : (
              "—"
            )}
          </div>
        </div>
      )}
    </StatCard>
  )
}

type GainsCardProps = {
  isLoading: boolean
  realisedProfitTao: number
  realisedProfitUsd: number
  unrealisedProfitTao: number
  unrealisedProfitUsd: number
}

const GainsCard: FC<GainsCardProps> = ({
  isLoading,
  realisedProfitTao,
  realisedProfitUsd,
  unrealisedProfitTao,
  unrealisedProfitUsd,
}) => {
  const { t } = useTranslation()
  const currency = useSelectedCurrency()

  const { realisedValue, unrealisedValue, realisedPercent, unrealisedPercent } = useMemo(() => {
    const realised = currency === "tao" ? realisedProfitTao : realisedProfitUsd
    const unrealised = currency === "tao" ? unrealisedProfitTao : unrealisedProfitUsd
    const realisedMag = Math.abs(realised)
    const unrealisedMag = Math.abs(unrealised)
    const total = realisedMag + unrealisedMag
    const rPct = total > 0 ? (realisedMag / total) * 100 : 0
    return {
      realisedValue: realised,
      unrealisedValue: unrealised,
      realisedPercent: rPct,
      unrealisedPercent: total > 0 ? 100 - rPct : 0,
    }
  }, [currency, realisedProfitTao, realisedProfitUsd, unrealisedProfitTao, unrealisedProfitUsd])

  const formatGain = (value: number) =>
    currency === "tao" ? formatTaoAmount(value) : formatUsdAmount(value)

  return (
    <StatCard title={t("Gains")}>
      {isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="!h-2 !w-full rounded-full" />
          <Skeleton />
          <Skeleton />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="bg-tertiary flex h-2 w-full overflow-hidden rounded-full">
            {realisedPercent > 0 && (
              <div className="bg-fg-brand h-full" style={{ width: `${realisedPercent}%` }} />
            )}
            {unrealisedPercent > 0 && (
              <div className="bg-secondary h-full" style={{ width: `${unrealisedPercent}%` }} />
            )}
          </div>

          {(
            [
              { label: t("Realized"), value: realisedValue, accent: "bg-fg-brand" },
              { label: t("Unrealized"), value: unrealisedValue, accent: "bg-fg-tertiary" },
            ] as const
          ).map(({ label, value, accent }) => (
            <div key={label} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className={classNames("h-3 w-0.5 shrink-0 rounded-full", accent)} />
                <span className="text-fg-secondary text-sm">{label}</span>
              </div>
              <span className="text-fg-primary text-sm">{formatGain(value)}</span>
            </div>
          ))}
        </div>
      )}
    </StatCard>
  )
}

type RankCardProps = {
  isLoading: boolean
  rank: number
  accountsTotal: number
  rankPercentage: number
}

const RankCard: FC<RankCardProps> = ({ isLoading, rank, accountsTotal, rankPercentage }) => {
  const { t } = useTranslation()

  const rankPercentageDisplay =
    accountsTotal > 0
      ? rankPercentage < 5
        ? formatNumber(rankPercentage, 3)
        : String(Math.round(rankPercentage))
      : null

  return (
    <StatCard title={t("Wallet Rank")}>
      {isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="!h-7 !w-28" />
          <Skeleton className="!w-48" />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-baseline gap-1.5 overflow-hidden">
            <span className="text-fg-primary text-xl font-medium">{rank.toLocaleString()}</span>
            <span className="text-fg-secondary text-sm">/{accountsTotal.toLocaleString()}</span>
          </div>
          {rankPercentageDisplay != null && (
            <div className="text-fg-tertiary flex items-center gap-2 text-xs">
              <Trophy01 className="size-4 shrink-0" />
              <span>
                {t("You're in the top")}{" "}
                <span className="text-fg-brand">{rankPercentageDisplay}%</span>{" "}
                {t("of Tao owners.")}
              </span>
            </div>
          )}
        </div>
      )}
    </StatCard>
  )
}

const AccountChartCard: FC<{
  address: string
  genesisHash?: `0x${string}` | null
  balanceTotalTao: number
  balanceTotalUsd: number
  coldkeyData: ReturnType<typeof useAccountPortfolioData>["coldkeyData"]
  isLoading: boolean
  isError: boolean
  dateRangeSelected: string
  onDateRangeChange: (value: string) => void
}> = ({
  address,
  genesisHash,
  balanceTotalTao,
  balanceTotalUsd,
  coldkeyData,
  isLoading,
  isError,
  dateRangeSelected,
  onDateRangeChange,
}) => {
  const { open: openExplorer, canOpen } = useViewOnExplorer(address, genesisHash)

  return (
    <SurfaceCard className="flex h-full min-h-[340px] w-full flex-col gap-4 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="text-fg-tertiary flex items-center gap-2 text-sm">
            <span className="truncate font-medium">{shortenAddress(address, 6, 4)}</span>
            <CopyAddressIconButton address={address} />
            {canOpen && (
              <button
                type="button"
                onClick={openExplorer}
                className="text-fg-tertiary hover:text-fg-primary shrink-0"
                aria-label="View on explorer"
              >
                <LinkExternal01 className="size-4" />
              </button>
            )}
          </div>
          <div className="flex flex-col gap-1">
            {isLoading ? (
              <>
                <Skeleton className="!h-8 !w-40" />
                <Skeleton className="!w-24" />
              </>
            ) : (
              <>
                <div className="text-fg-primary text-display-xs font-medium">
                  {formatTaoAmount(balanceTotalTao)}
                </div>
                <div className="text-fg-tertiary text-sm">{formatUsdAmount(balanceTotalUsd)}</div>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <DateRangeSelector
            dateRangeSelected={dateRangeSelected}
            onDateRangeChange={onDateRangeChange}
          />
          <CurrencySelector />
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <EarningsChart
          coldkeyData={coldkeyData}
          balanceTotalTao={balanceTotalTao}
          isLoading={isLoading}
          isError={isError}
          embedded
        />
      </div>
    </SurfaceCard>
  )
}

export const AccountPortfolioSummary: FC = () => {
  const { selectedAccount } = usePortfolioNavigation()
  const [dateRangeSelected, setDateRangeSelected] = useAtom(portfolioDateRangeAtom)
  const address = selectedAccount?.address
  const tokenRates = useTokenRatesMap()
  const taoUsdPrice = tokenRates?.[TAO_TOKEN_ID]?.usd?.price ?? 0

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

  const balanceTotalUsd = balanceTotalTao * taoUsdPrice

  if (!selectedAccount) return null

  return (
    <div className="flex flex-col items-stretch gap-3 lg:flex-row">
      <div className="flex min-h-[340px] min-w-0 flex-1">
        <AccountChartCard
          address={selectedAccount.address}
          genesisHash={getAccountGenesisHash(selectedAccount)}
          balanceTotalTao={balanceTotalTao}
          balanceTotalUsd={balanceTotalUsd}
          coldkeyData={coldkeyData}
          isLoading={isLoading}
          isError={isError}
          dateRangeSelected={dateRangeSelected}
          onDateRangeChange={(v) => setDateRangeSelected(v as "1d" | "1w" | "1m" | "1y")}
        />
      </div>

      <div className="flex shrink-0 flex-col gap-3 lg:w-[285px]">
        <EarningsCard
          isLoading={isLoading}
          isValidatorYieldLoading={isValidatorYieldLoading}
          totalEarningsTao={totalEarningsTao}
          totalEarningsUsd={totalEarningsUsd}
          overallYieldPercentage={overallYieldPercentage}
        />
        <GainsCard
          isLoading={isLoading}
          realisedProfitTao={realisedProfitTao}
          realisedProfitUsd={realisedProfitUsd}
          unrealisedProfitTao={unrealisedProfitTao}
          unrealisedProfitUsd={unrealisedProfitUsd}
        />
        <RankCard
          isLoading={isLoading}
          rank={rank}
          accountsTotal={accountsTotal}
          rankPercentage={rankPercentage}
        />
      </div>
    </div>
  )
}
