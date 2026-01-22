import { useMemo } from "react"

import { useRampSellTokens } from "../ramp/useRampSellTokens"

export const useRampsSellTokens = (currency: string | undefined) => {
  const { tokens: rampTokens = [], isLoading: isLoadingRampTokens } = useRampSellTokens(currency)

  const tokens = useMemo(() => {
    return Object.values(Object.fromEntries(rampTokens.map((t) => [t.id, t])))
  }, [rampTokens])

  return {
    tokens,
    isLoading: isLoadingRampTokens,
  }
}
