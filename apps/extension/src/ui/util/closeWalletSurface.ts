import { CLOSE_SIDE_PANEL_MESSAGE, SIDE_PANEL_AFTER_APPROVAL_MESSAGE, SIDE_PANEL_WAS_OPEN_KEY } from "extension-shared"

import { IS_EMBEDDED_POPUP, IS_POPUP } from "./constants"

const isSidePanelSurface = () =>
  document.documentElement.classList.contains("side-panel")

/**
 * Dismiss or reset the current wallet UI surface.
 * - Floating popup (Firefox): closes the OS popup window.
 * - Embedded toolbar popup: closes the dropdown.
 * - Side panel: closes the panel.
 *
 * Used from navigation, login, send flows, etc. For dapp approval completion, prefer `closeWalletSurfaceAfterApproval`.
 */
export async function closeWalletSurface() {
  if (!IS_POPUP) {
    window.close()
    return
  }

  if (IS_EMBEDDED_POPUP) {
    window.close()
    return
  }

  if (isSidePanelSurface()) {
    try {
      const [win, [activeTab]] = await Promise.all([
        chrome.windows.getCurrent(),
        chrome.tabs.query({ active: true, lastFocusedWindow: true }),
      ])

      await chrome.runtime.sendMessage({
        type: CLOSE_SIDE_PANEL_MESSAGE,
        windowId: win.id,
        tabId: activeTab?.id,
      })
    } catch {
      // ignore
    }
    return
  }

  try {
    const win = await chrome.windows.getCurrent()
    if (win.type === "popup") {
      window.close()
      return
    }
  } catch {
    // ignore — side panel may not expose window type reliably
  }
}

/** Close after a dapp approval, restoring the side panel open/closed state from before the request. */
export async function closeWalletSurfaceAfterApproval() {
  if (!IS_POPUP) {
    window.close()
    return
  }

  if (IS_EMBEDDED_POPUP) {
    window.close()
    return
  }

  try {
    const win = await chrome.windows.getCurrent()

    if (win.type === "popup") {
      window.close()
      return
    }

    if (isSidePanelSurface()) {
      const stored = await chrome.storage.session.get(SIDE_PANEL_WAS_OPEN_KEY)
      const wasOpenBeforeApproval = stored[SIDE_PANEL_WAS_OPEN_KEY] === true

      // Notify background first — a page navigation aborts in-flight messages.
      await chrome.runtime.sendMessage({
        type: SIDE_PANEL_AFTER_APPROVAL_MESSAGE,
        windowId: win.id,
      })

      // Only navigate locally when the panel should stay open (avoids a blank flash).
      if (wasOpenBeforeApproval) {
        const { pathname, search } = window.location
        if (window.location.hash !== "#/portfolio") {
          window.location.replace(`${pathname}${search}#/portfolio`)
        }
      }
      return
    }
  } catch {
    // fall through
  }

  await closeWalletSurface()
}
