import { TokenId } from "@taostats-wallet/chaindata-provider"

export const SUPPORTED_CURRENCIES = {
  tao: { name: "Bittensor", symbol: "τ" },
  usd: { name: "US Dollar", symbol: "$" },
} as const

export type TokenRatesStorage = { tokenRates: TokenRatesList }

export type TokenRatesList = Record<TokenId, TokenRates>
export type TokenRates = Record<TokenRateCurrency, TokenRateData | null>

export type TokenRateData = { price: number; marketCap?: number; change24h?: number }
export type TokenRateCurrency = keyof typeof SUPPORTED_CURRENCIES

export const newTokenRates = (): TokenRates => ({
  tao: null,
  usd: null,
})
