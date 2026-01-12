import { BalanceFormatter } from "@taostats-wallet/balances"
import { isTokenNeedExistentialDeposit, Token, TokenId } from "@taostats-wallet/chaindata-provider"
import { useMemo } from "react"

import { useToken } from "@ui/state"

export const useExistentialDeposit = (tokenId: TokenId | null | undefined) => {
  const token = useToken(tokenId) as Token

  const plancks = useMemo(() => {
    if (!token) return null
    return isTokenNeedExistentialDeposit(token) ? BigInt(token.existentialDeposit) : 0n
  }, [token])

  return useMemo(() => {
    if (!token || typeof plancks !== "bigint") return null
    return new BalanceFormatter(plancks, token.decimals)
  }, [token, plancks])
}
