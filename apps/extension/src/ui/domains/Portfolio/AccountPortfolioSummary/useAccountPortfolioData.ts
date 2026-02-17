import { useQueries, useQuery } from "@tanstack/react-query"

import type { StakeBalanceItem } from "./portfolioApi"
import { portfolioApi } from "./portfolioApi"

const TAO_DECIMALS = 9

const getNumberOfDaysFromDateRange = (range: "1d" | "1w" | "1m" | "1y") => {
  switch (range) {
    case "1d":
      return 1
    case "1w":
      return 7
    case "1m":
      return 30
    case "1y":
      return 365
    default:
      return 30
  }
}

// Stake balance API returns realised_profit_tao / unrealised_profit_tao in rao (chain units).
// Match dashboard: always divide by 10^9 to convert to TAO (getHumanValueFromChainValue).
const fromRaoToTao = (rao: string | number): number =>
  Number(rao ?? 0) / 10 ** TAO_DECIMALS

const convertDateRangeToDates = (range: "1d" | "1w" | "1m" | "1y") => {
  const now = new Date()
  const to = now.toISOString().split("T")[0]
  const from = new Date()

  switch (range) {
    case "1d":
      from.setDate(now.getDate() - 1)
      break
    case "1w":
      from.setDate(now.getDate() - 7)
      break
    case "1m":
      from.setDate(now.getDate() - 30)
      break
    case "1y":
      from.setFullYear(now.getFullYear() - 1)
      break
  }

  return { from: from.toISOString().split("T")[0], to }
}

export const useAccountPortfolioData = (
  address: string | undefined,
  dateRange: "1d" | "1w" | "1m" | "1y",
) => {
  const { from, to } = convertDateRangeToDates(dateRange)

  const accountQuery = useQuery({
    queryKey: ["portfolio", "account", address],
    queryFn: () => portfolioApi.getAccountLatest(address!),
    enabled: !!address && address.length > 20,
  })

  const statsQuery = useQuery({
    queryKey: ["portfolio", "stats"],
    queryFn: () => portfolioApi.getStatsLatest(),
  })

  const coldkeyReportQuery = useQuery({
    queryKey: ["portfolio", "coldkeyReport", address, from, to],
    queryFn: () => portfolioApi.getColdkeyReport(address!, from, to),
    enabled: !!address && address.length > 10,
    staleTime: 1000 * 60 * 60,
  })

  const days = getNumberOfDaysFromDateRange(dateRange)
  const stakeBalanceQuery = useQuery({
    queryKey: ["portfolio", "stakeBalance", address, days],
    queryFn: () => portfolioApi.getStakeBalance(address!, days),
    enabled: !!address && address.length > 10,
    staleTime: 1000 * 30,
  })

  const stakeBalanceData = stakeBalanceQuery.data?.data ?? []

  const validatorYieldQueries = useQueries({
    queries: stakeBalanceData.map((item: StakeBalanceItem) => ({
      queryKey: ["portfolio", "validatorYield", item.netuid, item.hotkey?.ss58],
      queryFn: () =>
        portfolioApi.getValidatorYieldLatest(item.netuid, item.hotkey?.ss58 ?? ""),
      enabled:
        !!address &&
        stakeBalanceData.length > 0 &&
        item.netuid != null &&
        !!item.hotkey?.ss58,
    })),
  })

  const accountData = accountQuery.data?.data?.[0]
  const statsData = statsQuery.data?.data?.[0]
  const coldkeyData = coldkeyReportQuery.data?.data ?? []

  // Parse balance from rao to TAO
  const balanceTotalTao = accountData?.balance_total
    ? Number(accountData.balance_total) / 10 ** TAO_DECIMALS
    : 0
  const balance24hAgoTao = accountData?.balance_total_24hr_ago
    ? Number(accountData.balance_total_24hr_ago) / 10 ** TAO_DECIMALS
    : 0

  // Gains = price change in period
  const gainsTao = balanceTotalTao - balance24hAgoTao
  const gainsPercent =
    balance24hAgoTao > 0 ? (gainsTao / balance24hAgoTao) * 100 : 0

  // Earnings from stake balance (match dashboard: sum total_earned_alpha_as_tao and total_earned_alpha_as_usd per position)
  const totalEarningsTao = (stakeBalanceData as StakeBalanceItem[]).reduce(
    (sum, item) =>
      sum + fromRaoToTao(item.total_earned_alpha_as_tao ?? 0),
    0,
  )
  const totalEarningsUsd = (stakeBalanceData as StakeBalanceItem[]).reduce(
    (sum, item) =>
      sum + Number(item.total_earned_alpha_as_usd ?? 0),
    0,
  )

  const validatorYieldData = validatorYieldQueries.flatMap((q) => q.data?.data ?? [])

  const getApyForPosition = (netuid: number, hotkeySs58: string): number => {
    const record = validatorYieldData.find(
      (r) => r.netuid === netuid && r.hotkey?.ss58 === hotkeySs58,
    )
    if (!record) return 0
    switch (dateRange) {
      case "1d":
        return Number(record.one_day_apy ?? 0)
      case "1w":
        return Number(record.seven_day_apy ?? 0)
      case "1m":
      case "1y":
        return Number(record.thirty_day_apy ?? 0)
      default:
        return 0
    }
  }

  const overallYieldPercentage = (() => {
    if (stakeBalanceData.length === 0) return null
    let summedBalance = 0
    let summedYield = 0
    for (const item of stakeBalanceData as StakeBalanceItem[]) {
      const balanceTao = fromRaoToTao(item.balance_as_tao)
      const apy = getApyForPosition(item.netuid, item.hotkey?.ss58 ?? "")
      summedBalance += balanceTao
      summedYield += balanceTao * apy
    }
    if (summedBalance <= 0) return null
    return (summedYield / summedBalance) * 100
  })()

  const gains = stakeBalanceData.reduce(
    (acc, d) => ({
      realisedProfitTao: acc.realisedProfitTao + fromRaoToTao(d.realised_profit_tao),
      realisedProfitUsd: acc.realisedProfitUsd + Number(d.realised_profit_usd ?? 0),
      unrealisedProfitTao: acc.unrealisedProfitTao + fromRaoToTao(d.unrealised_profit_tao),
      unrealisedProfitUsd: acc.unrealisedProfitUsd + Number(d.unrealised_profit_usd ?? 0),
    }),
    { realisedProfitTao: 0, realisedProfitUsd: 0, unrealisedProfitTao: 0, unrealisedProfitUsd: 0 },
  )

  const rank = accountData?.rank ?? 0
  const accountsTotal = statsData?.accounts ?? 0
  const rankPercentage = accountsTotal > 0 ? (rank / accountsTotal) * 100 : 0

  const isValidatorYieldLoading = validatorYieldQueries.some((q) => q.isLoading)

  return {
    isLoading:
      accountQuery.isLoading ||
      statsQuery.isLoading ||
      coldkeyReportQuery.isLoading ||
      stakeBalanceQuery.isLoading,
    isValidatorYieldLoading,
    isError:
      accountQuery.isError ||
      statsQuery.isError ||
      coldkeyReportQuery.isError ||
      stakeBalanceQuery.isError,
    accountData,
    balanceTotalTao,
    balance24hAgoTao,
    gainsTao,
    gainsPercent,
    realisedProfitTao: gains.realisedProfitTao,
    realisedProfitUsd: gains.realisedProfitUsd,
    unrealisedProfitTao: gains.unrealisedProfitTao,
    unrealisedProfitUsd: gains.unrealisedProfitUsd,
    totalEarningsTao,
    totalEarningsUsd,
    overallYieldPercentage,
    rank,
    accountsTotal,
    rankPercentage,
    coldkeyData,
    coldkeyReportQuery,
  }
}
