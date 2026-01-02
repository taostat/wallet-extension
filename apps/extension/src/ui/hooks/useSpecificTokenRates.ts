import { useQuery } from "@tanstack/react-query"
import { Token } from "@taostats/chaindata-provider"
import { fetchTokenRates, TokenRateCurrency } from "@taostats/token-rates"
import { keyBy } from "lodash-es"
import { useMemo } from "react"

import { useSelectedCurrency, useTokenRatesMap } from "@ui/state"

/**
 * Fetches token rates for a specific set of tokens, even if they are not enabled.
 */
export const useSpecificTokenRates = (
  tokens: Token[] | undefined,
  currencyIds?: TokenRateCurrency[],
) => {
  const enabledTokenRates = useTokenRatesMap()
  const selectedCurrency = useSelectedCurrency()

  const queryKey = useMemo(
    () =>
      tokens
        ?.concat()
        .sort()
        .map((t) => t.id)
        .join("::"),
    [tokens],
  )

  return useQuery({
    queryKey: ["useSpecificTokenRates", queryKey, currencyIds],
    queryFn: () => {
      if (!tokens?.length) return {}
      const tokensMap = keyBy(tokens, (t) => t.id)
      return fetchTokenRates(tokensMap, currencyIds ?? [selectedCurrency])
    },
    initialData: enabledTokenRates,
    enabled: !!tokens,
  })
}
