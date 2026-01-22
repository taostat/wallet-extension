import { useMemo } from "react"

import { useRampBuyTokens } from "../ramp/useRampBuyTokens"

export const useRampsBuyTokens = (currency: string | undefined) => {
  const { tokens: rampTokens = [], isLoading: isLoadingRampTokens } = useRampBuyTokens(currency)

  const tokens = useMemo(() => {
    return Object.values(Object.fromEntries(rampTokens.map((t) => [t.id, t])))
  }, [rampTokens])

  return {
    tokens,
    isLoading: isLoadingRampTokens,
  }
}
