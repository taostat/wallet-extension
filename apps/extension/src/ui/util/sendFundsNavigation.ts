import type { SendFundsOpenRequest } from "extension-core"

export const buildSendFundsRoute = ({
  from,
  tokenId,
  tokenSymbol,
  to,
}: SendFundsOpenRequest = {}) => {
  const params = new URLSearchParams()
  if (from) params.set("from", from)
  if (tokenId) params.set("tokenId", tokenId)
  else if (tokenSymbol) params.set("tokenSymbol", tokenSymbol)
  if (to) params.set("to", to)

  return `/send?${params.toString()}`
}
