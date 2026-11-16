/**
 * The id of a settled sell's system notification. It is a URL: the wallet's service worker opens a
 * notification's id when it is a URL and the notification is clicked
 * (`extension-core`'s `ensureNotificationClickHandler`).
 *
 * - Delivered: the sell's transaction, as its Recent swaps row's "View the transaction" opens it.
 * - Needs attention (refunded), or a delivered sell without a transaction URL: the wallet's
 *   dashboard portfolio, where the "Swap needs attention" notice is. The query parameter (before
 *   the `#`: the dashboard's routes are in the hash) makes it one notification per sell, so a
 *   second notice about the same sell replaces the first.
 */
export function sellNoticeUrl({
  kind,
  recordId,
  transactionUrl,
  dashboardUrl,
}: {
  kind: "delivered" | "attention"
  /** The sell's record id. */
  recordId: string
  /** The sell's extrinsic on the explorer, when known. */
  transactionUrl?: string | null
  /** The wallet's dashboard page (`chrome.runtime.getURL("dashboard.html")`). */
  dashboardUrl: string
}): string {
  if (kind === "delivered" && transactionUrl) return transactionUrl
  const url = new URL(dashboardUrl)
  url.searchParams.set("crossChainSell", recordId)
  url.hash = "/portfolio"
  return url.toString()
}
