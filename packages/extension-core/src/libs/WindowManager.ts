import { sleep } from "@taostats-wallet/util"
import {
  IS_CHROME,
  IS_FIREFOX,
  log,
  NAVIGATE_SIDE_PANEL_MESSAGE,
  OPEN_SIDEPANEL_MESSAGE,
  SIDE_PANEL_AFTER_APPROVAL_MESSAGE,
  SIDE_PANEL_VISIBILITY_MESSAGE,
  SIDE_PANEL_WAS_OPEN_KEY,
} from "extension-shared"

import { appStore } from "../domains/app/store.app"
import { RequestRoute } from "../domains/app/types"

/** Returned when UI is shown in the Chrome side panel instead of a popup window. */
export const SIDE_PANEL_SURFACE_ID = -1

export type PopupOpenOptions = {
  /** When false on Chrome, never opens a floating popup (side panel only). */
  allowPopupFallback?: boolean
}

const WINDOW_OPTS: chrome.windows.CreateData & { width: number; height: number } = {
  type: "popup",
  url: chrome.runtime.getURL("popup.html"),
  width: 400,
  height: 600,
}

const DEFAULT_SIDE_PANEL_PORTFOLIO_PATH = "popup.html#/portfolio"

class WindowManager {
  #windows: number[] = []
  // Prevents opening two onboarding tabs at once
  #onboardingTabOpening = false
  // Prevents opening two login popups at once
  #isLoginPromptOpen = false
  #sidePanelCloseCallbacks = new Set<() => void>()
  #initialized = false
  /** Tab that triggered a dapp approval — used to route the side panel without a user gesture. */
  #gestureTabId: number | undefined
  /** Whether the side panel is currently visible to the user. */
  #sidePanelKnownOpen = false
  /** Snapshot taken once per dapp approval (guards against double-recording from content script + port handler). */
  #sidePanelWasOpenBeforeCurrentApproval: boolean | undefined
  /** Dapp tab/window that opened the panel for the current approval — used to close it again. */
  #approvalTabId: number | undefined
  #approvalWindowId: number | undefined

  private canUseSidePanel() {
    return IS_CHROME && Boolean(chrome.sidePanel?.setOptions)
  }

  private resetSidePanelApprovalTracking() {
    this.#sidePanelWasOpenBeforeCurrentApproval = undefined
    void chrome.storage.session.remove(SIDE_PANEL_WAS_OPEN_KEY)
  }

  private recordSidePanelStateBeforeApproval() {
    if (this.#sidePanelWasOpenBeforeCurrentApproval !== undefined) return

    this.#sidePanelWasOpenBeforeCurrentApproval = this.#sidePanelKnownOpen
    void chrome.storage.session.set({ [SIDE_PANEL_WAS_OPEN_KEY]: this.#sidePanelKnownOpen })
  }

  /**
   * Opens the side panel during a user gesture when needed.
   * Skips open if the panel is already visible so post-approval close can restore prior state.
   */
  private openSidePanelDuringGesture(tabId?: number, windowId?: number) {
    this.recordSidePanelStateBeforeApproval()

    if (tabId !== undefined) this.#approvalTabId = tabId
    if (windowId !== undefined) this.#approvalWindowId = windowId

    if (this.#sidePanelKnownOpen) return

    try {
      if (tabId !== undefined) chrome.sidePanel.open({ tabId })
      else if (windowId !== undefined) chrome.sidePanel.open({ windowId })
    } catch (err) {
      log.error("Failed to open side panel during user gesture", err)
    }
  }

  private async resetSidePanelPath(tabId?: number, path = DEFAULT_SIDE_PANEL_PORTFOLIO_PATH) {
    if (!this.canUseSidePanel()) return

    try {
      if (tabId !== undefined) {
        await chrome.sidePanel.setOptions({ tabId, path, enabled: true })
      }
      await chrome.sidePanel.setOptions({ path, enabled: true })
    } catch (err) {
      log.error("Failed to reset side panel path", { tabId, err })
    }
  }

  private async closeSidePanel(windowId?: number, tabId?: number) {
    if (!this.canUseSidePanel()) return

    const sidePanel = chrome.sidePanel as typeof chrome.sidePanel & {
      close?: (options: { windowId?: number; tabId?: number }) => Promise<void>
    }

    const attempts: Array<{ tabId?: number; windowId?: number }> = []
    if (tabId !== undefined) attempts.push({ tabId })
    if (windowId !== undefined) attempts.push({ windowId })
    if (attempts.length === 0) {
      const win = await chrome.windows.getLastFocused()
      if (win.id !== undefined) attempts.push({ windowId: win.id })
    }

    if (sidePanel.close) {
      for (const options of attempts) {
        try {
          await sidePanel.close(options)
          this.#sidePanelKnownOpen = false
          return
        } catch (err) {
          log.warn("chrome.sidePanel.close attempt failed", { options, err })
        }
      }
    }

    // No close API or all attempts failed — keep portfolio visible rather than a blank panel.
    await this.notifySidePanelNavigation("#/portfolio")
  }

  async handleSidePanelAfterApproval(windowId?: number) {
    const stored = await chrome.storage.session.get(SIDE_PANEL_WAS_OPEN_KEY)
    const hasSnapshot =
      this.#sidePanelWasOpenBeforeCurrentApproval !== undefined ||
      stored[SIDE_PANEL_WAS_OPEN_KEY] !== undefined

    if (!hasSnapshot) return

    const wasOpenBeforeApproval =
      this.#sidePanelWasOpenBeforeCurrentApproval ?? stored[SIDE_PANEL_WAS_OPEN_KEY] === true

    const tabId = this.#approvalTabId
    const approvalWindowId = windowId ?? this.#approvalWindowId

    this.resetSidePanelApprovalTracking()
    this.#approvalTabId = undefined
    this.#approvalWindowId = undefined

    // Clear tab-specific approval URL so the next toolbar open loads portfolio.
    await this.resetSidePanelPath(tabId)

    if (wasOpenBeforeApproval) {
      await this.notifySidePanelNavigation("#/portfolio")
      return
    }

    await this.closeSidePanel(approvalWindowId, tabId)
  }

  /** Called during a dapp user gesture to open the side panel before async approval handling. */
  captureGestureAndOpenSidePanel(tabId?: number, windowId?: number) {
    if (!this.canUseSidePanel()) return

    if (tabId !== undefined) this.#gestureTabId = tabId

    this.openSidePanelDuringGesture(tabId, windowId)
  }

  init() {
    if (this.#initialized || !IS_CHROME || !chrome.sidePanel?.open) return
    this.#initialized = true

    chrome.sidePanel
      .setPanelBehavior({ openPanelOnActionClick: true })
      .catch((err) => log.error("Failed to set side panel behavior", err))

    chrome.runtime.onMessage.addListener((message, sender) => {
      if (message?.type === SIDE_PANEL_VISIBILITY_MESSAGE) {
        this.#sidePanelKnownOpen = message.visible === true
        return
      }

      if (message?.type === SIDE_PANEL_AFTER_APPROVAL_MESSAGE) {
        void this.handleSidePanelAfterApproval(message.windowId as number | undefined)
        return
      }

      if (message?.type !== OPEN_SIDEPANEL_MESSAGE) return

      const tabId = sender.tab?.id
      const windowId = sender.tab?.windowId

      if (tabId !== undefined) this.#gestureTabId = tabId

      // Must call open synchronously to preserve the user gesture chain.
      this.openSidePanelDuringGesture(tabId, windowId)
    })

    const sidePanel = chrome.sidePanel as typeof chrome.sidePanel & {
      onClosed?: chrome.events.Event<(windowId: number) => void>
      onOpened?: chrome.events.Event<(windowId: number) => void>
    }

    sidePanel.onOpened?.addListener(() => {
      this.#sidePanelKnownOpen = true
    })

    sidePanel.onClosed?.addListener(() => {
      this.#sidePanelKnownOpen = false
      this.#sidePanelCloseCallbacks.forEach((cb) => cb())
      this.#sidePanelCloseCallbacks.clear()
    })
  }

  private waitTabLoaded = (tabId: number): Promise<void> => {
    // wait either page to be loaded or a 3 seconds timeout, first to occur wins
    // this is to handle edge cases where page is closed or breaks before loading
    return Promise.race<void>([
      //promise that waits for page to be loaded
      new Promise((resolve) => {
        const handler = (id: number, changeInfo: chrome.tabs.TabChangeInfo) => {
          if (id !== tabId) return
          if (changeInfo.status === "complete") {
            // dispose of the listener to prevent a memory leak
            chrome.tabs.onUpdated.removeListener(handler)
            resolve()
          }
        }
        chrome.tabs.onUpdated.addListener(handler)
      }),
      // promise for the timeout
      sleep(3000),
    ])
  }

  /**
   * Creates a new tab for a url if it isn't already open, or else focuses the existing tab if it is.
   *
   * @param url: The full url including # path or route that should be used to create the tab if it doesn't exist
   * @param baseUrl: Optional, the base url (eg 'chrome-extension://idgkbaeeleekhpeoakcbpbcncikdhboc/dashboard.html') without the # path
   *
   */
  private async openTabOnce({
    url,
    baseUrl,
    shouldFocus = true,
  }: {
    url: string
    baseUrl?: string
    shouldFocus?: boolean
  }): Promise<chrome.tabs.Tab> {
    const queryUrl = baseUrl ?? url

    let [tab] = await chrome.tabs.query({ url: queryUrl })

    if (tab?.id) {
      const options: chrome.tabs.UpdateProperties = { active: shouldFocus }
      if (url !== tab.url) options.url = url
      const { windowId } = await chrome.tabs.update(tab.id, options)

      if (shouldFocus && windowId) {
        const { focused } = await chrome.windows.getLastFocused()
        if (!focused) await chrome.windows.update(windowId, { focused: true })
      }
    } else {
      tab = await chrome.tabs.create({ url })
    }

    // wait for page to be loaded if it isn't
    if (tab.status === "loading") await this.waitTabLoaded(tab.id as number)
    return tab
  }

  public async openOnboarding(route?: string) {
    if (this.#onboardingTabOpening) return
    this.#onboardingTabOpening = true
    const baseUrl = chrome.runtime.getURL(`onboarding.html`)

    const onboarded = await appStore.getIsOnboarded()

    await this.openTabOnce({
      url: `${baseUrl}${route ? `#${route}` : ""}`,
      baseUrl,
      shouldFocus: onboarded,
    })
    this.#onboardingTabOpening = false
  }

  public async openDashboard({ route }: RequestRoute) {
    const baseUrl = chrome.runtime.getURL("dashboard.html")

    await this.openTabOnce({ url: `${baseUrl}#${route}`, baseUrl })

    return true
  }

  async popupClose(id?: number) {
    if (id === SIDE_PANEL_SURFACE_ID) return

    if (id) {
      await chrome.windows.remove(id)
      this.#windows = this.#windows.filter((wid) => wid !== id)
    } else {
      await Promise.all(this.#windows.map((wid) => chrome.windows.remove(wid)))
      this.#windows = []
    }
  }

  private async notifySidePanelNavigation(hashRoute?: string) {
    if (!hashRoute) return

    const hash = hashRoute.startsWith("#") ? hashRoute : `#${hashRoute}`
    const message = { type: NAVIGATE_SIDE_PANEL_MESSAGE, hash }

    // Retry while the side panel React app is mounting.
    for (let attempt = 0; attempt < 20; attempt++) {
      try {
        await chrome.runtime.sendMessage(message)
        return
      } catch {
        await sleep(150)
      }
    }

    log.warn("Side panel navigation message was not acknowledged", { hash })
  }

  private async navigateSidePanel(hashRoute?: string): Promise<boolean> {
    if (!this.canUseSidePanel()) return false

    try {
      const gestureTabId = this.#gestureTabId
      this.#gestureTabId = undefined

      const [activeTab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
      const tabId = gestureTabId ?? activeTab?.id

      const path = hashRoute
        ? `popup.html${hashRoute.startsWith("#") ? hashRoute : `#${hashRoute}`}`
        : "popup.html"

      // setOptions updates the path for the next open; notifySidePanelNavigation handles an already-open panel.
      if (tabId !== undefined) {
        await chrome.sidePanel.setOptions({ tabId, path, enabled: true })
      } else {
        await chrome.sidePanel.setOptions({ path, enabled: true })
      }

      await this.notifySidePanelNavigation(hashRoute)

      return true
    } catch (err) {
      log.error("Failed to navigate side panel", err)
      return false
    }
  }

  async popupOpen(argument?: string, onClose?: () => void, options?: PopupOpenOptions) {
    const allowPopupFallback = options?.allowPopupFallback ?? true

    if (this.canUseSidePanel()) {
      const navigated = await this.navigateSidePanel(argument)

      if (navigated || !allowPopupFallback) {
        if (onClose) this.#sidePanelCloseCallbacks.add(onClose)
        return SIDE_PANEL_SURFACE_ID
      }
    }

    if (!allowPopupFallback && this.canUseSidePanel()) {
      if (onClose) this.#sidePanelCloseCallbacks.add(onClose)
      return SIDE_PANEL_SURFACE_ID
    }

    const currWindow = await chrome.windows.getLastFocused()
    const [widthDelta, heightDelta] = await appStore.get("popupSizeDelta")

    const { left, top } = {
      top: 100 + (currWindow?.top ?? 0),
      left: currWindow?.width ? (currWindow.left ?? 0) + currWindow.width - 500 : 500,
    }

    const popupCreateArgs: chrome.windows.CreateData = {
      ...WINDOW_OPTS,
      url: chrome.runtime.getURL(`popup.html${argument ?? ""}`),
      top,
      left,
      width: WINDOW_OPTS.width + widthDelta,
      height: WINDOW_OPTS.height + heightDelta,
    }

    let popup: chrome.windows.Window
    try {
      popup = await chrome.windows.create(popupCreateArgs)
    } catch (err) {
      log.error("Failed to open popup", err)

      // retry with default size, as an invalid size could be the source of the error
      popup = await chrome.windows.create({
        ...popupCreateArgs,
        width: WINDOW_OPTS.width,
        height: WINDOW_OPTS.height,
      })
    }

    if (typeof popup?.id !== "undefined") {
      this.#windows.push(popup.id || 0)
      // firefox compatibility (cannot be set at creation)
      if (IS_FIREFOX && popup.left !== left && popup.state !== "fullscreen") {
        await chrome.windows.update(popup.id, { left, top })
      }
    }

    if (onClose) {
      chrome.windows.onRemoved.addListener(function onRemoved(id) {
        if (id === popup.id) {
          chrome.windows.onRemoved.removeListener(onRemoved)
          onClose()
        }
      })
    }

    // popup is undefined when running tests
    return popup?.id
  }

  public async promptLogin() {
    if (this.#isLoginPromptOpen) return false

    this.#isLoginPromptOpen = true

    await windowManager.popupOpen(`?closeAfterLogin=true`, () => {
      this.#isLoginPromptOpen = false
    })

    return true
  }
}

export const windowManager = new WindowManager()
