import type { SendFundsOpenRequest } from "extension-core"
import { OPEN_SIDEPANEL_MESSAGE } from "extension-shared"

import { api } from "@ui/api"

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

/** Opens send funds in the side panel from dashboard/desktop UI. Must run during a user gesture. */
export const openSendFundsFromDashboard = (request: SendFundsOpenRequest = {}) => {
  try {
    chrome.runtime.sendMessage({ type: OPEN_SIDEPANEL_MESSAGE, forNavigation: true })
  } catch {
    // Side panel is Chrome-only; sendFundsOpen still opens a floating popup on Firefox.
  }

  void api.sendFundsOpen(request)
}
