import { formatDecimals, planckToTokens } from "@taostats/util"

export const formatEthValue = (value: bigint, decimals: number, symbol?: string) => {
  return `${formatDecimals(planckToTokens(value.toString(), decimals))}${
    symbol ? ` ${symbol}` : ""
  }`
}
