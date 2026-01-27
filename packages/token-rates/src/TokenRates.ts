import { Token, TokenId } from "@taostats-wallet/chaindata-provider"
import { uniq } from "lodash-es"

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

const USE_TAOSTATS_API = true

export const DEFAULT_TOKEN_RATES_CONFIG: TokenRatesApiConfig = {
  apiUrl: "http://localhost:3001/api/wallet",
}

export async function fetchTokenRates(
  tokens: Record<TokenId, Token>,
  currencyIdsParam: TokenRateCurrency[] = ALL_CURRENCY_IDS,
  config: TokenRatesApiConfig = DEFAULT_TOKEN_RATES_CONFIG,
): Promise<TokenRatesList> {
  const taostatsVersion = await fetchTokenRatesNew(tokens, currencyIdsParam, config)
  const oldVersion = await fetchTokenRatesOld(tokens, currencyIdsParam, config)

  console.log("🍕🍕🍕🍕🍕🍕", { taostatsVersion, oldVersion })

  return USE_TAOSTATS_API ? taostatsVersion : oldVersion
}

export async function fetchTokenRatesNew(
  tokens: Record<TokenId, Token>,
  currencyIdsParam: TokenRateCurrency[] = ALL_CURRENCY_IDS,
  config: TokenRatesApiConfig = DEFAULT_TOKEN_RATES_CONFIG,
): Promise<TokenRatesList> {
  console.log("🐸🐸🐸 fetchTokenRates", config.apiUrl, { tokens, currencyIdsParam, config })

  const currencyIds = [...new Set(currencyIdsParam).add("tao")]
  console.log("🐸🐸🐸", { currencyIds })

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
  console.log("🤪🤪🤪", { netuidToTokenIds, netuids })

  const hasVsTao = currencyIds.includes("tao")

  const requestBody = {
    ids: netuids,
  }

  console.log(
    "🐸🐸🐸🐸 FETCHING TOKEN RATES FROM",
    `${DEFAULT_TOKEN_RATES_CONFIG.apiUrl}/token-rates`,
    "with body",
    requestBody,
  )

  // taostats api call
  const response = await fetch(`${DEFAULT_TOKEN_RATES_CONFIG.apiUrl}/token-rates`, {
    method: "POST",
    body: JSON.stringify(requestBody),
  })

  const rawTokenRates: RawTokenRates = await response.json()
  console.log("🤷‍♂️", { rawTokenRates })

  if (hasVsTao) {
    // calculate the TAO<>USD rate

    //const effectiveTaoIndex = effectiveCoingeckoIds.indexOf("bittensor")
    //const effectiveUsdIndex = effectiveCurrencyIds.indexOf("usd")

    const effectiveTaoIndex = netuids.indexOf("0")
    const effectiveUsdIndex = 0
    const taoUsdRate = rawTokenRates[effectiveTaoIndex]?.[effectiveUsdIndex]?.[0]
    const taoUsdChange24h = rawTokenRates[effectiveTaoIndex]?.[effectiveUsdIndex]?.[2]

    console.log("🤷‍♂️", { effectiveTaoIndex, effectiveUsdIndex, taoUsdRate, taoUsdChange24h })

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
  console.log("😱😱😱", { tokenRates })

  // build a TokenRatesList from the token prices result
  const ratesList: TokenRatesList = Object.fromEntries(
    Object.entries(filteredTokenMap).map(([tokenId, token]) => [
      tokenId,
      token.netuid !== undefined ? (tokenRates[String(token.netuid)] ?? null) : null,
    ]),
  ) as TokenRatesList

  console.log("😱😱😱", { ratesList })

  return ratesList
}

// To save on bandwidth and work around response size limits, values are returned without json property names
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

export const DEFAULT_COINSAPI_CONFIG: TokenRatesApiConfig = {
  apiUrl: "https://coins.talisman.xyz",
}

export async function fetchTokenRatesOld(
  tokens: Record<TokenId, Token>,
  currencyIds: TokenRateCurrency[] = ALL_CURRENCY_IDS,
  config: TokenRatesApiConfig = DEFAULT_COINSAPI_CONFIG,
): Promise<TokenRatesList> {
  console.log("😵‍💫 ---------- ORIGINAL ------------ ", { tokens, currencyIds, config })

  // create a map from `coingeckoId` -> `tokenId` for each token
  const coingeckoIdToTokenIds = Object.values(tokens)
    .flatMap((token) => {
      // ignore tokens which don't have a coingeckoId
      if (!token.coingeckoId) return []

      return [{ id: token.id, coingeckoId: token.coingeckoId }]
    })

    // get each token's coingeckoId
    .reduce(
      (coingeckoIdToTokenIds, { id, coingeckoId }) => {
        if (!coingeckoIdToTokenIds[coingeckoId]) coingeckoIdToTokenIds[coingeckoId] = []
        coingeckoIdToTokenIds[coingeckoId].push(id)
        return coingeckoIdToTokenIds
      },
      {} as Record<string, string[]>,
    )

  // create a list of coingeckoIds we want to fetch
  const coingeckoIds = Object.keys(coingeckoIdToTokenIds).sort()

  // skip network request if there is nothing for us to fetch
  if (coingeckoIds.length < 1) return {}

  // If `currencyIds` includes `tao`, we need to always fetch the `bittensor` coingeckoId and the `usd` currency,
  // we can use these to calculate the currency rate for TAO relative to all other tokens.
  //
  // We support showing balances in TAO just like we support BTC/ETH/DOT, but coingecko doesn't support TAO as a vs currency rate.
  // We can macgyver our own TOKEN<>TAO rate by combining the TOKEN<>USD data with the TAO<>USD data.
  const hasVsTao = currencyIds.includes("tao")
  const [effectiveCoingeckoIds, effectiveCurrencyIds] = hasVsTao
    ? [
        [...new Set(coingeckoIds).add("bittensor")],
        [
          ...new Set(
            // don't request `tao` from coingecko (we calculate it from `usd`)
            currencyIds.filter((c) => c !== "tao"),
          )
            // always include `usd` (so we can calculate `tao`)
            .add("usd"),
        ],
      ]
    : [coingeckoIds, currencyIds]

  const response = await fetch(`${DEFAULT_COINSAPI_CONFIG.apiUrl}/token-rates`, {
    method: "POST",
    body: JSON.stringify({
      coingeckoIds: effectiveCoingeckoIds,
      currencyIds: effectiveCurrencyIds,
    }),
  })

  const rawTokenRates: RawTokenRates = await response.json()
  console.log("😵‍💫", { rawTokenRates })

  if (hasVsTao) {
    // calculate the TAO<>USD rate
    const effectiveTaoIndex = effectiveCoingeckoIds.indexOf("bittensor")
    const effectiveUsdIndex = effectiveCurrencyIds.indexOf("usd")
    const taoUsdRate = rawTokenRates[effectiveTaoIndex]?.[effectiveUsdIndex]?.[0]
    const taoUsdChange24h = rawTokenRates[effectiveTaoIndex]?.[effectiveUsdIndex]?.[2]

    console.log("😵‍💫", { effectiveTaoIndex, effectiveUsdIndex, taoUsdRate, taoUsdChange24h })

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

  const tokenRates = parseTokenRatesFromApi(rawTokenRates, coingeckoIds, currencyIds)
  console.log("😵‍💫", { tokenRates })

  // build a TokenRatesList from the token prices result
  const ratesList: TokenRatesList = Object.fromEntries(
    Object.entries(tokens).map(([tokenId, token]) => [
      tokenId,
      token.coingeckoId ? (tokenRates[token.coingeckoId] ?? null) : null,
    ]),
  ) as TokenRatesList

  console.log("😵‍💫", { ratesList })

  return ratesList
}

const parseTokenRatesFromApi = (
  rawTokenRates: RawTokenRates,
  coingeckoIds: string[],
  currencyIds: TokenRateCurrency[],
): TokenRatesList => {
  return Object.fromEntries(
    coingeckoIds.map((coingeckoId, idx) => {
      const rates = rawTokenRates[idx]
      if (!rates) return [coingeckoId, null]

      return [
        coingeckoId,
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
