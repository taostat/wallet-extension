import { Token } from "@taostats-wallet/chaindata-provider"

type RootTaoToken = Pick<Token, "type" | "symbol"> & { netuid?: number }

/** Free or root (netuid 0) TAO — same symbol in portfolio, duplicate fiat when currency is TAO. */
export const isRootTaoHolding = (token: RootTaoToken | null | undefined): boolean => {
  if (!token) return false

  if (token.type === "substrate-dtao" && token.netuid === 0) return true

  if (
    token.type === "substrate-native" &&
    (token.symbol === "TAO" || token.symbol === "testTAO")
  ) {
    return true
  }

  return false
}

export const isRootTaoSymbol = (symbol: string | null | undefined): boolean =>
  symbol === "TAO" || symbol === "testTAO"

export const isAlphaSymbol = (symbol: string | null | undefined): boolean => symbol === "α"
