import { sentry } from "../config/sentry"
import { ensureNotificationClickHandler } from "./ensureNotificationClickHandler"

export const APPROVAL_NOTIFICATION_ID_PREFIX = "taostats-approval:"
export const APPROVAL_NOTIFICATION_SESSION_KEY = "sidePanelApprovalNotification"

export type ApprovalNotificationPayload = {
  tabId: number
  path: string
  notificationId: string
}

export const clearApprovalNotification = async () => {
  try {
    const stored = await chrome.storage.session.get(APPROVAL_NOTIFICATION_SESSION_KEY)
    const payload = stored[APPROVAL_NOTIFICATION_SESSION_KEY] as
      | ApprovalNotificationPayload
      | undefined

    if (payload?.notificationId) {
      chrome.notifications.clear(payload.notificationId)
    }

    await chrome.storage.session.remove(APPROVAL_NOTIFICATION_SESSION_KEY)
  } catch (err) {
    sentry.captureException(err)
  }
}

export const createApprovalNotification = async ({
  notificationId,
  tabId,
  path,
  siteLabel,
}: {
  notificationId: string
  tabId: number
  path: string
  siteLabel: string
}) => {
  try {
    ensureNotificationClickHandler()

    await clearApprovalNotification()

    const id = `${APPROVAL_NOTIFICATION_ID_PREFIX}${notificationId}`

    await chrome.storage.session.set({
      [APPROVAL_NOTIFICATION_SESSION_KEY]: { tabId, path, notificationId: id },
    })

    chrome.notifications.create(id, {
      type: "basic",
      title: "Taostats needs your approval",
      message: `${siteLabel} is requesting access. Click to open the wallet.`,
      iconUrl: "/images/icon-round.png",
    })
  } catch (err) {
    sentry.captureException(err)
  }
}
