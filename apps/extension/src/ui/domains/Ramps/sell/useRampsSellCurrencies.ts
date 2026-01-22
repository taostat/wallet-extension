import { isNotNil } from "@taostats-wallet/util"
import { useMemo } from "react"

import { useRampCurrencies } from "../ramp/useRampCurrencies"
import { getRampsCurrency } from "../shared/currencies"

export const useRampsSellCurrencies = () => {
  const { data: rampCurrencies, isLoading: isLoadingOnRampCurrencies } = useRampCurrencies()

  const currencies = useMemo(() => {
    if (isLoadingOnRampCurrencies) return undefined
    return [
      ...new Set([
        ...(rampCurrencies?.filter((c) => c.offrampAvailable).map((c) => c.fiatCurrency) ?? []),
      ]),
    ]
      .map(getRampsCurrency)
      .filter(isNotNil)
  }, [isLoadingOnRampCurrencies, rampCurrencies])

  return {
    currencies,
    isLoading: isLoadingOnRampCurrencies,
  }
}
