import { useQuery } from "@tanstack/react-query"

import { portfolioApi } from "./portfolioApi"

const TAO_DECIMALS = 9

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

  // Earnings from coldkey report (sum of daily_income - values are in rao/planck)
  const totalEarningsTao = coldkeyData.reduce((sum, item) => {
    const incomeRao = item.daily_income ? Number(item.daily_income) : 0
    return sum + incomeRao / 10 ** TAO_DECIMALS
  }, 0)
  const totalEarningsUsd = coldkeyData.reduce((sum, item) => {
    const income = item.daily_income_usd ? Number(item.daily_income_usd) : 0
    return sum + income
  }, 0)

  const rank = accountData?.rank ?? 0
  const accountsTotal = statsData?.accounts ?? 0
  const rankPercentage = accountsTotal > 0 ? (rank / accountsTotal) * 100 : 0

  return {
    isLoading:
      accountQuery.isLoading || statsQuery.isLoading || coldkeyReportQuery.isLoading,
    isError:
      accountQuery.isError ||
      statsQuery.isError ||
      coldkeyReportQuery.isError,
    accountData,
    balanceTotalTao,
    balance24hAgoTao,
    gainsTao,
    gainsPercent,
    totalEarningsTao,
    totalEarningsUsd,
    rank,
    accountsTotal,
    rankPercentage,
    coldkeyData,
    coldkeyReportQuery,
  }
}
