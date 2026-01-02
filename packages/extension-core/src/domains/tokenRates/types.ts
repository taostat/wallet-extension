import { TokenRatesStorage } from "@taostats/token-rates"

export interface TokenRatesMessages {
  // tokenRates message signatures
  "pri(tokenRates.subscribe)": [null, boolean, TokenRatesStorage]
}
