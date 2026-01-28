import { Token, TokenId } from "@taostats-wallet/chaindata-provider"
import { cloneDeep, uniq } from "lodash-es"

import {
  SUPPORTED_CURRENCIES,
  TokenRateCurrency,
  TokenRateData,
  TokenRates,
  TokenRatesList,
} from "./types"

export class TokenRatesError extends Error {
  response?: Response
  constructor(message: string, response?: Response) {
    super(message)
    this.response = response
  }
}

export const ALL_CURRENCY_IDS = Object.keys(SUPPORTED_CURRENCIES) as TokenRateCurrency[]
export type TokenRatesApiConfig = {
  apiUrl: string
}

export const DEFAULT_TOKEN_RATES_CONFIG: TokenRatesApiConfig = {
  apiUrl: "http://localhost:3001/api/wallet",
}

export async function fetchTokenRates(
  tokens: Record<TokenId, Token>,
  currencyIdsParam: TokenRateCurrency[] = ALL_CURRENCY_IDS,
  config: TokenRatesApiConfig = DEFAULT_TOKEN_RATES_CONFIG,
): Promise<TokenRatesList> {
  const currencyIds = [...new Set(currencyIdsParam).add("tao")]

  const filteredTokens = Object.values(tokens)
    .filter((token) => token.type === "substrate-dtao")
    .map((token) => {
      return {
        id: token.id,
        type: token.type,
        netuid: token.netuid,
        networkId: token.networkId,
      }
    })
    .filter((token) => token.networkId === "bittensor")

  const filteredTokenMap = filteredTokens.reduce(
    (acc, token) => {
      acc[token.id] = token
      return acc
    },
    {} as Record<string, (typeof filteredTokens)[number]>,
  )

  // create a map from `netuid` --> `tokenId` for each token
  const netuidToTokenIds = filteredTokens.reduce(
    (acc, token) => {
      acc[token.netuid.toString()] = [token.id]
      return acc
    },
    {} as Record<string, [string]>,
  )

  // Get list of netuids to fetch
  // Ensure we always get the root netuid (netuid 0) too
  const netuids = [...new Set(uniq(Object.keys(netuidToTokenIds)).sort()).add("0")]

  const hasVsTao = currencyIds.includes("tao")

  const requestBody = {
    ids: netuids,
  }

  // taostats api call
  const response = await fetch(`${DEFAULT_TOKEN_RATES_CONFIG.apiUrl}/token-rates`, {
    method: "POST",
    body: JSON.stringify(requestBody),
  })

  const rawTokenRates: RawTokenRates = await response.json()

  if (hasVsTao) {
    // calculate the TAO<>USD rate

    const effectiveTaoIndex = netuids.indexOf("0")
    const effectiveUsdIndex = 0
    const taoUsdRate = rawTokenRates[effectiveTaoIndex]?.[effectiveUsdIndex]?.[0]
    const taoUsdChange24h = rawTokenRates[effectiveTaoIndex]?.[effectiveUsdIndex]?.[2]

    // insert TOKEN<>TAO rate (calculated based on TAO<>USD rate and TOKEN<>USD rate) into each TOKEN
    const taoIndex = currencyIds.indexOf("tao")
    rawTokenRates.forEach((rates, i) => {
      // hardcoded rate for TAO<>TAO
      if (i === effectiveTaoIndex) {
        rates?.splice(taoIndex, 0, [1, null, null])
        return
      }

      // get TOKEN<>USD rate
      const tokenUsdRate = rates?.[effectiveUsdIndex]?.[0]
      // calculate TOKEN<>TAO rate
      const tokenTaoRate =
        typeof tokenUsdRate === "number" && typeof taoUsdRate === "number" && taoUsdRate !== 0
          ? tokenUsdRate / taoUsdRate
          : null

      const tokenUsdChange24h = rates?.[effectiveUsdIndex]?.[2]
      const tokenTaoChange24h =
        typeof taoUsdChange24h === "number" && typeof tokenUsdChange24h === "number"
          ? (1 + tokenUsdChange24h) / (1 + taoUsdChange24h) - 1
          : null

      // insert at the correct location (based on the index of `tao` in `currencyIds`)
      rates?.splice(taoIndex, 0, [tokenTaoRate, null, tokenTaoChange24h])
    })
  }

  const tokenRates = parseTokenRatesFromApiNew(rawTokenRates, netuids, currencyIds)

  // build a TokenRatesList from the token prices result
  const ratesList: TokenRatesList = Object.fromEntries(
    Object.entries(filteredTokenMap).map(([tokenId, token]) => [
      tokenId,
      token.netuid !== undefined ? (tokenRates[String(token.netuid)] ?? null) : null,
    ]),
  ) as TokenRatesList

  const rootEntry = ratesList["bittensor:substrate-dtao:0"]
  if (!rootEntry) {
    // eslint-disable-next-line no-console
    console.error("Root entry not found")
  } else {
    ratesList["bittensor:substrate-native"] = cloneDeep(rootEntry)
  }

  return ratesList
}

// values are returned without json property names
// (e.g. [[[12, 12332, 0.5]]] instead of { dot : {usd: { value: 12, marketCap: 12332, change24h: 0.5 }} })
type RawTokenRates = [number | null, number | null, number | null][][]

const parseTokenRatesFromApiNew = (
  rawTokenRates: RawTokenRates,
  netuids: string[],
  currencyIds: TokenRateCurrency[],
): TokenRatesList => {
  return Object.fromEntries(
    netuids.map((netuid, idx) => {
      const rates = rawTokenRates[idx]
      if (!rates) return [netuid, null]

      return [
        netuid,
        Object.fromEntries(
          currencyIds.map((currencyId, idx) => {
            const curRate = rates[idx]
            if (!curRate) return [currencyId, null]

            const [price, marketCap, change24h] = rates[idx]
            return [currencyId, { price, marketCap, change24h } as TokenRateData]
          }),
        ) as TokenRates,
      ]
    }),
  ) as TokenRatesList
}
