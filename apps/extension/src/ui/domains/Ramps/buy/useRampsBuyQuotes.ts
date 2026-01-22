import { useMemo } from "react"

import { useRampBuyQuote } from "../ramp/useRampBuyQuote"
import { RampsBuyQuoteOptions, RampsBuyQuoteQuery } from "./types"

export const useRampsBuyQuotes = (config: RampsBuyQuoteOptions | null) => {
  const queryRamp = useRampBuyQuote(config)

  return useMemo<RampsBuyQuoteQuery[]>(() => [{ provider: "ramp", query: queryRamp }], [queryRamp])
}
