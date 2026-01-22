import { isNotNil } from "@taostats-wallet/util"
import { log } from "extension-shared"
import { useMemo } from "react"

import { useRampCurrencies } from "../ramp/useRampCurrencies"
import { getRampsCurrency } from "../shared/currencies"

export const useRampsBuyCurrencies = () => {
  const { data: rampCurrencies, isLoading: isLoadingOnRampCurrencies } = useRampCurrencies()

  const currencies = useMemo(() => {
    if (isLoadingOnRampCurrencies) return undefined
    return [
      ...new Set([
        ...(rampCurrencies?.filter((c) => c.onrampAvailable).map((c) => c.fiatCurrency) ?? []),
      ]),
    ]
      .map((code) => {
        const currency = getRampsCurrency(code)
        // @dev: if this warning appears, add an entry to RAMPS_CURRENCIES_MAP
        if (!currency) log.warn("[ramps] Missing currency", code)
        return currency
      })
      .filter(isNotNil)
  }, [isLoadingOnRampCurrencies, rampCurrencies])

  return {
    currencies,
    isLoading: isLoadingOnRampCurrencies,
  }
}
