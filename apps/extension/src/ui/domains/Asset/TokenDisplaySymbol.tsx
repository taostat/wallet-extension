import { TokenId } from "@taostats-wallet/chaindata-provider"
import { FC } from "react"

import { useToken } from "@ui/state"

/**
 * To be used when a meaningful symbol is needed for display purposes.
 */
export const TokenDisplaySymbol: FC<{ tokenId: TokenId }> = ({ tokenId }) => {
  const token = useToken(tokenId)

  if (!token) return null

  if (token.type === "substrate-dtao") {
    if (token.subnetName) return token.subnetName
    if (token.netuid === 0) return "Root"
    return token.symbol
  }

  return token.symbol
}
