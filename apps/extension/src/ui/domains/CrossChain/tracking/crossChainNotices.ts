import { log } from "extension-shared"

/**
 * A system notification about a cross-chain sell (the `notifications` permission). Its id isn't a
 * URL, so the service worker's click handler (which opens URL ids) leaves it alone: it informs, and
 * the wallet shows the rest. Never throws.
 */
export const showCrossChainSystemNotification = ({
  id,
  title,
  message,
}: {
  /** The sell's record id: a second notice about the same sell replaces the first. */
  id: string
  title: string
  message: string
}) => {
  try {
    if (typeof chrome === "undefined" || !chrome.notifications?.create) return
    const notificationId = `crossChainSell-${id}`
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
