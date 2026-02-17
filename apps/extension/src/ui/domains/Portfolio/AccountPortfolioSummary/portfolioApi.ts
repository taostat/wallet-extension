import { fetchTaostats } from "@ui/domains/Staking/hooks/bittensor/dTao/fetchTaostats"

// Types matching Taostats website API responses (used by wallet-extension API)
export type AccountLatestItem = {
  address: { ss58: string; hex?: string }
  balance_total: string
  balance_total_24hr_ago?: string | null
  rank?: number
}

export type AccountLatestResponse = {
  data: AccountLatestItem[]
  pagination: { total_items: number; total_pages: number }
}

export type StatsItem = {
  accounts?: number
  [key: string]: unknown
}

export type StatsLatestResponse = {
  data: StatsItem[]
  pagination: { total_items: number }
}

export type ColdkeyReportItem = {
  date?: string | null
  timestamp?: string | null
  total_balance?: string | null
  tao_price?: string | null
  daily_income?: string | null
  daily_income_usd?: string | null
  [key: string]: unknown
}

export type ColdkeyReportResponse = {
  data: ColdkeyReportItem[]
  pagination: { total_items: number }
}

export type StakeBalanceItem = {
  netuid: number
  hotkey: { ss58: string; hex?: string }
  balance_as_tao: string
  total_earned_alpha_as_tao?: string
  total_earned_alpha_as_usd?: string
  realised_profit_tao: string
  realised_profit_usd: string
  unrealised_profit_tao: string
  unrealised_profit_usd: string
  [key: string]: unknown
}

export type ValidatorYieldItem = {
  netuid: number
  hotkey: { ss58: string; hex?: string }
  one_day_apy: string
  seven_day_apy: string
  thirty_day_apy: string
  [key: string]: unknown
}

export type ValidatorYieldResponse = {
  data: ValidatorYieldItem[]
  pagination: { total_items: number }
}

export type StakeBalanceResponse = {
  data: StakeBalanceItem[]
  pagination: { total_items: number }
}

export const portfolioApi = {
  getAccountLatest: (address: string) =>
    fetchTaostats<AccountLatestResponse>({
      path: `/account/${encodeURIComponent(address)}/latest`,
    }),

  getColdkeyReport: (address: string, fromDate: string, toDate: string) =>
    fetchTaostats<ColdkeyReportResponse>({
      path: `/account/${encodeURIComponent(address)}/coldkeyReport/${fromDate}/${toDate}`,
    }),

  getStatsLatest: () =>
    fetchTaostats<StatsLatestResponse>({
      path: "/stats/latest",
    }),

  getStakeBalance: (address: string, days: number) =>
    fetchTaostats<StakeBalanceResponse>({
      path: `/account/${encodeURIComponent(address)}/stake/balance`,
      params: { days: days.toString() },
    }),

  getValidatorYieldLatest: (netuid: number, hotkey: string) =>
    fetchTaostats<ValidatorYieldResponse>({
      path: "/validator-yield-latest",
      params: { netuid, hotkey },
    }),
}
