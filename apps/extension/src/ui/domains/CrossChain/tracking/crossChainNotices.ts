import { sellNoticeUrl } from "@taostats-wallet/cross-chain"
import { log } from "extension-shared"

/**
 * A system notification about a settled cross-chain sell (the `notifications` permission). Its id
 * is the URL a click opens (`sellNoticeUrl`), which the service worker's click handler opens: the
 * sell's transaction once delivered, else the dashboard portfolio, where the "Swap needs attention"
 * notice is. One per sell: a second notice about the same sell replaces the first. Never throws.
 */
export const showCrossChainSystemNotification = ({
  kind,
  recordId,
  transactionUrl,
  title,
  message,
}: {
  kind: "delivered" | "attention"
  /** The sell's record id. */
  recordId: string
  /** The sell's extrinsic on the explorer, when known. */
  transactionUrl: string | null
  title: string
  message: string
}) => {
  try {
    if (typeof chrome === "undefined" || !chrome.notifications?.create) return
    const notificationId = sellNoticeUrl({
      kind,
      recordId,
      transactionUrl,
      dashboardUrl: chrome.runtime.getURL("dashboard.html"),
    })
    chrome.notifications.create(
      notificationId,
      { type: "basic", iconUrl: "/images/icon-round.png", title, message },
      // Read, so a refusal (notifications blocked) isn't reported as unchecked.
      () => void chrome.runtime.lastError,
    )
  } catch (error) {
    log.debug("[cross-chain] System notification not shown", { error })
  }
}
