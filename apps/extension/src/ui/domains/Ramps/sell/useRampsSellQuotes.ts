import { useMemo } from "react"

import { useRampSellQuote } from "../ramp/useRampSellQuote"
import { RampsSellQuoteOptions, RampsSellQuoteQuery } from "./types"

export const useRampsSellQuotes = (config: RampsSellQuoteOptions | null) => {
  const queryRamp = useRampSellQuote(config)

  return useMemo<RampsSellQuoteQuery[]>(() => [{ provider: "ramp", query: queryRamp }], [queryRamp])
}
