import { sleep } from "@taostats-wallet/util"
import {
  IS_CHROME,
  IS_FIREFOX,
  CLOSE_SIDE_PANEL_MESSAGE,
  log,
  NAVIGATE_SIDE_PANEL_MESSAGE,
  OPEN_SIDEPANEL_MESSAGE,
  SIDE_PANEL_AFTER_APPROVAL_MESSAGE,
  SIDE_PANEL_APPROVAL_TAB_KEY,
  SIDE_PANEL_VISIBILITY_MESSAGE,
  SIDE_PANEL_WAS_OPEN_KEY,
} from "extension-shared"

import { appStore } from "../domains/app/store.app"
import { RequestRoute } from "../domains/app/types"
import {
  APPROVAL_NOTIFICATION_ID_PREFIX,
  APPROVAL_NOTIFICATION_SESSION_KEY,
  clearApprovalNotification,
  createApprovalNotification,
} from "../notifications"

/** Returned when UI is shown in the Chrome side panel instead of a popup window. */
export const SIDE_PANEL_SURFACE_ID = -1

export type PopupOpenOptions = {
  /** When false on Chrome, never opens a floating popup (side panel only). */
  allowPopupFallback?: boolean
  /**
   * `approval` — dapp connect/sign/metadata (tab-scoped panel, must stay enabled on dapp tabs).
   * `navigation` — in-app routes e.g. send from desktop (window-scoped, clears tab bindings).
   */
  mode?: "approval" | "navigation"
  /** Dapp origin shown in approval notifications when the side panel cannot auto-open. */
  approvalSiteUrl?: string
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
  /** Tab/window that opened the panel for in-app navigation (e.g. dashboard Send). */
  #navigationTabId: number | undefined
  #navigationWindowId: number | undefined
  /** In-memory payload for synchronous side panel open on notification click (must not await before open). */
  #approvalNotificationPayload:
    | { tabId: number; path: string; notificationId: string }
    | undefined

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

  private recordNavigationSidePanelContext(tabId?: number, windowId?: number) {
    if (tabId !== undefined) this.#navigationTabId = tabId
    if (windowId !== undefined) this.#navigationWindowId = windowId
  }

  private clearNavigationSidePanelContext() {
    this.#navigationTabId = undefined
    this.#navigationWindowId = undefined
  }

  private persistApprovalSidePanelContext(tabId?: number, windowId?: number) {
    if (tabId !== undefined) {
      this.#approvalTabId = tabId
      void chrome.storage.session.set({ [SIDE_PANEL_APPROVAL_TAB_KEY]: tabId })
    }
    if (windowId !== undefined) this.#approvalWindowId = windowId
  }

  private clearApprovalSidePanelContext() {
    this.#approvalTabId = undefined
    this.#approvalWindowId = undefined
    void chrome.storage.session.remove(SIDE_PANEL_APPROVAL_TAB_KEY)
  }

  private async resolveApprovalTabId(): Promise<number | undefined> {
    if (this.#approvalTabId !== undefined) return this.#approvalTabId

    try {
      const stored = await chrome.storage.session.get(SIDE_PANEL_APPROVAL_TAB_KEY)
      const tabId = stored[SIDE_PANEL_APPROVAL_TAB_KEY]
      return typeof tabId === "number" ? tabId : undefined
    } catch {
      return undefined
    }
  }

  private async getSidePanelCloseAttempts(
    windowId?: number,
    tabId?: number,
  ): Promise<Array<{ tabId?: number; windowId?: number }>> {
    const attempts: Array<{ tabId?: number; windowId?: number }> = []
    const seen = new Set<string>()

    const addAttempt = (attempt: { tabId?: number; windowId?: number }) => {
      const key = `${attempt.tabId ?? ""}:${attempt.windowId ?? ""}`
      if (seen.has(key)) return
      seen.add(key)
      attempts.push(attempt)
    }

    const approvalTabId = await this.resolveApprovalTabId()

    const addTabAttempts = () => {
      if (tabId !== undefined) addAttempt({ tabId })
      if (approvalTabId !== undefined && approvalTabId !== tabId) addAttempt({ tabId: approvalTabId })
      if (this.#navigationTabId !== undefined) addAttempt({ tabId: this.#navigationTabId })
    }

    const addWindowAttempts = () => {
      if (windowId !== undefined) addAttempt({ windowId })
      if (this.#navigationWindowId !== undefined) addAttempt({ windowId: this.#navigationWindowId })
      if (this.#approvalWindowId !== undefined) addAttempt({ windowId: this.#approvalWindowId })
    }

    // Tab-specific approval panels must close via tabId — windowId close rejects (Chrome 145+).
    // Navigation panels (desktop send) must close via windowId — tab close fails on extension tabs.
    const preferTabClose = approvalTabId !== undefined || tabId !== undefined

    if (preferTabClose) {
      addTabAttempts()
      addWindowAttempts()
    } else {
      addWindowAttempts()
      addTabAttempts()
    }

    try {
      const win = await chrome.windows.getLastFocused({ populate: true })
      if (win.id !== undefined) addAttempt({ windowId: win.id })
      const activeTab = win.tabs?.find((t) => t.active)
      if (activeTab?.id !== undefined) addAttempt({ tabId: activeTab.id })
    } catch {
      // ignore
    }

    try {
      const [activeTab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
      if (activeTab?.windowId !== undefined) addAttempt({ windowId: activeTab.windowId })
      if (activeTab?.id !== undefined) addAttempt({ tabId: activeTab.id })
    } catch {
      // ignore
    }

    return attempts
  }

  /**
   * Opens the side panel during a user gesture when needed.
   * Skips open if the panel is already visible so post-approval close can restore prior state.
   */
  private openSidePanelDuringGesture(
    tabId?: number,
    windowId?: number,
    options?: { forApproval?: boolean },
  ) {
    const forNavigation = options?.forApproval === false

    if (!forNavigation) {
      // Skip open when already visible so post-approval close can restore prior state.
      if (this.#sidePanelKnownOpen) return

      this.recordSidePanelStateBeforeApproval()

      this.persistApprovalSidePanelContext(tabId, windowId)

      // setOptions + open must stay synchronous to preserve the user gesture chain.
      try {
        if (tabId !== undefined) {
          void chrome.sidePanel.setOptions({
            tabId,
            path: DEFAULT_SIDE_PANEL_PORTFOLIO_PATH,
            enabled: true,
          })
          chrome.sidePanel.open({ tabId })
        } else if (windowId !== undefined) {
          chrome.sidePanel.open({ windowId })
        }
      } catch (err) {
        log.error("Failed to open side panel during user gesture", err)
      }
      return
    }

    if (windowId !== undefined) {
      this.recordNavigationSidePanelContext(undefined, windowId)
    } else if (tabId !== undefined) {
      this.recordNavigationSidePanelContext(tabId, windowId)
    }

    try {
      if (windowId !== undefined) {
        chrome.sidePanel.open({ windowId })
      } else if (tabId !== undefined) {
        chrome.sidePanel.open({ tabId })
      }
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

    const attempts = await this.getSidePanelCloseAttempts(windowId, tabId)

    const approvalTabId = await this.resolveApprovalTabId()

    if (sidePanel.close) {
      for (const options of attempts) {
        try {
          await sidePanel.close(options)
          this.#sidePanelKnownOpen = false
          this.clearNavigationSidePanelContext()
          if (approvalTabId !== undefined) {
            this.clearApprovalSidePanelContext()
          }
          return
        } catch (err) {
          log.warn("chrome.sidePanel.close attempt failed", { options, err })
        }
      }
    }

    // Fallback for tab-scoped panels when close() rejects (e.g. opened via toolbar).
    const tabIdsToCollapse = new Set<number>()
    if (tabId !== undefined) tabIdsToCollapse.add(tabId)
    if (approvalTabId !== undefined) tabIdsToCollapse.add(approvalTabId)

    for (const collapseTabId of tabIdsToCollapse) {
      try {
        await chrome.sidePanel.setOptions({ tabId: collapseTabId, enabled: false })
        await chrome.sidePanel.setOptions({ tabId: collapseTabId, enabled: true })
        this.#sidePanelKnownOpen = false
        this.clearNavigationSidePanelContext()
        this.clearApprovalSidePanelContext()
        return
      } catch (err) {
        log.warn("sidePanel tab collapse attempt failed", { tabId: collapseTabId, err })
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

    const tabId = this.#approvalTabId ?? (await this.resolveApprovalTabId())
    const approvalWindowId = windowId ?? this.#approvalWindowId

    this.resetSidePanelApprovalTracking()
    this.clearApprovalSidePanelContext()
    this.clearApprovalNotificationState()

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

    chrome.notifications.onClicked.addListener((notificationId) => {
      if (notificationId.startsWith(APPROVAL_NOTIFICATION_ID_PREFIX)) {
        this.handleApprovalNotificationClick(notificationId)
      }
    })

    void this.restoreApprovalNotificationPayloadFromSession()

    chrome.runtime.onMessage.addListener((message, sender) => {
      if (message?.type === SIDE_PANEL_VISIBILITY_MESSAGE) {
        this.#sidePanelKnownOpen = message.visible === true
        if (message.visible === true) this.clearApprovalNotificationState()
        return
      }

      if (message?.type === SIDE_PANEL_AFTER_APPROVAL_MESSAGE) {
        void this.handleSidePanelAfterApproval(message.windowId as number | undefined)
        return
      }

      if (message?.type === CLOSE_SIDE_PANEL_MESSAGE) {
        void this.closeSidePanel(
          message.windowId as number | undefined,
          message.tabId as number | undefined,
        )
        return
      }

      if (message?.type !== OPEN_SIDEPANEL_MESSAGE) return

      const tabId = sender.tab?.id
      const windowId = sender.tab?.windowId
      const forNavigation = message.forNavigation === true

      if (tabId !== undefined) this.#gestureTabId = tabId

      // Must call open synchronously to preserve the user gesture chain.
      this.openSidePanelDuringGesture(tabId, windowId, { forApproval: !forNavigation })
    })

    const sidePanel = chrome.sidePanel as typeof chrome.sidePanel & {
      onClosed?: chrome.events.Event<(windowId: number) => void>
      onOpened?: chrome.events.Event<(windowId: number) => void>
    }

    sidePanel.onOpened?.addListener(() => {
      this.#sidePanelKnownOpen = true

      if (this.#sidePanelWasOpenBeforeCurrentApproval === undefined) {
        void chrome.tabs
          .query({ active: true, lastFocusedWindow: true })
          .then(([activeTab]) => {
            if (activeTab?.windowId !== undefined) {
              this.recordNavigationSidePanelContext(undefined, activeTab.windowId)
            }
          })
          .catch(() => {})
      }
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
    await this.dismissSidePanelAfterDashboardOpen()

    return true
  }

  private async dismissSidePanelAfterDashboardOpen() {
    if (!this.canUseSidePanel()) return

    try {
      const [activeTab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })

      if (activeTab?.id !== undefined) {
        try {
          await chrome.sidePanel.setOptions({ tabId: activeTab.id, enabled: false })
        } catch {
          // ignore
        }
      }

      await chrome.sidePanel.setOptions({ path: DEFAULT_SIDE_PANEL_PORTFOLIO_PATH, enabled: true })
      await this.closeSidePanel(activeTab?.windowId)
    } catch (err) {
      log.warn("Failed to close side panel after opening dashboard", err)
    } finally {
      // Expand dismiss can leave this stale while the panel is actually closed, which skips
      // the sync open on the first Send from desktop.
      this.#sidePanelKnownOpen = false
    }
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

  private clearApprovalNotificationState() {
    this.#approvalNotificationPayload = undefined
    void clearApprovalNotification()
  }

  private async restoreApprovalNotificationPayloadFromSession() {
    try {
      const stored = await chrome.storage.session.get(APPROVAL_NOTIFICATION_SESSION_KEY)
      const payload = stored[APPROVAL_NOTIFICATION_SESSION_KEY] as
        | { tabId?: number; path?: string; notificationId?: string }
        | undefined

      if (
        payload?.tabId !== undefined &&
        payload.path &&
        payload.notificationId &&
        !this.#approvalNotificationPayload
      ) {
        this.#approvalNotificationPayload = {
          tabId: payload.tabId,
          path: payload.path,
          notificationId: payload.notificationId,
        }
      }
    } catch {
      // ignore
    }
  }

  /**
   * Must run synchronously on notification click — any await before sidePanel.open loses the gesture.
   */
  handleApprovalNotificationClick(notificationId: string) {
    if (!this.canUseSidePanel()) return

    const payload =
      this.#approvalNotificationPayload?.notificationId === notificationId
        ? this.#approvalNotificationPayload
        : undefined

    if (!payload) {
      log.warn("Approval notification clicked without in-memory payload", { notificationId })
      void this.openApprovalSidePanelFromNotificationFallback()
      return
    }

    const { tabId, path } = payload

    this.persistApprovalSidePanelContext(tabId)

    void chrome.sidePanel.setOptions({ tabId, path, enabled: true })
    try {
      void chrome.sidePanel.open({ tabId }).catch((err) => {
        log.warn("Failed to open side panel from approval notification", err)
      })
    } catch (err) {
      log.warn("Failed to open side panel from approval notification", err)
    }

    void this.completeApprovalNotificationClick(tabId)
  }

  private async openApprovalSidePanelFromNotificationFallback() {
    try {
      const stored = await chrome.storage.session.get(APPROVAL_NOTIFICATION_SESSION_KEY)
      const payload = stored[APPROVAL_NOTIFICATION_SESSION_KEY] as
        | { tabId?: number; path?: string }
        | undefined

      if (payload?.tabId === undefined || !payload.path) return

      const { tabId, path } = payload

      await chrome.tabs.update(tabId, { active: true })
      await chrome.sidePanel.setOptions({ tabId, path, enabled: true })
      // Gesture already lost — user may need to click the toolbar icon.
      try {
        await chrome.sidePanel.open({ tabId })
      } catch {
        // ignore
      }
    } catch (err) {
      log.error("Failed fallback approval notification handling", err)
    }
  }

  private async completeApprovalNotificationClick(tabId: number) {
    try {
      await chrome.tabs.update(tabId, { active: true })
      const tab = await chrome.tabs.get(tabId)
      if (tab.windowId !== undefined) {
        await chrome.windows.update(tab.windowId, { focused: true })
      }
    } catch {
      // ignore
    }

    this.clearApprovalNotificationState()
  }

  private async maybeNotifyApprovalSidePanelRequired({
    tabId,
    path,
    hashRoute,
    siteUrl,
  }: {
    tabId?: number
    path: string
    hashRoute?: string
    siteUrl?: string
  }) {
    if (!this.canUseSidePanel()) return

    // Allow a briefly-opened panel time to report visibility before notifying.
    await sleep(400)

    if (this.#sidePanelKnownOpen) {
      this.clearApprovalNotificationState()
      return
    }

    const resolvedTabId = tabId ?? (await this.resolveApprovalTabId())
    if (resolvedTabId === undefined) return

    let siteLabel = "A site"
    if (siteUrl) {
      try {
        siteLabel = new URL(siteUrl).hostname
      } catch {
        siteLabel = siteUrl
      }
    }

    const notificationKey =
      hashRoute?.replace(/^#\//, "").replace(/\//g, "-") ?? `tab-${resolvedTabId}`
    const fullNotificationId = `${APPROVAL_NOTIFICATION_ID_PREFIX}${notificationKey}`

    this.#approvalNotificationPayload = {
      tabId: resolvedTabId,
      path,
      notificationId: fullNotificationId,
    }

    void createApprovalNotification({
      notificationId: notificationKey,
      tabId: resolvedTabId,
      path,
      siteLabel,
    })
  }

  private async navigateSidePanel(
    hashRoute?: string,
    mode: PopupOpenOptions["mode"] = "approval",
    meta?: { approvalSiteUrl?: string },
  ): Promise<boolean> {
    if (!this.canUseSidePanel()) return false

    try {
      const gestureTabId = this.#gestureTabId
      this.#gestureTabId = undefined

      const [activeTab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
      const tabId = gestureTabId ?? activeTab?.id

      let windowId = activeTab?.windowId
      if (tabId !== undefined) {
        try {
          const tab = await chrome.tabs.get(tabId)
          windowId = tab.windowId
        } catch {
          // use activeTab windowId
        }
      }

      const path = hashRoute
        ? `popup.html${hashRoute.startsWith("#") ? hashRoute : `#${hashRoute}`}`
        : "popup.html"

      if (mode === "approval") {
        if (tabId !== undefined) {
          this.persistApprovalSidePanelContext(tabId, windowId)

          try {
            await chrome.sidePanel.setOptions({ tabId, path, enabled: true })
          } catch {
            // ignore
          }
        }

        await chrome.sidePanel.setOptions({ path, enabled: true })
        await this.notifySidePanelNavigation(hashRoute)

        void this.maybeNotifyApprovalSidePanelRequired({
          tabId,
          path,
          hashRoute,
          siteUrl: meta?.approvalSiteUrl,
        })

        return true
      }

      if (windowId !== undefined) {
        this.recordNavigationSidePanelContext(undefined, windowId)
      }

      // Clear any tab-scoped options (e.g. left over from a prior expand/send cycle on dashboard).
      if (tabId !== undefined) {
        try {
          await chrome.sidePanel.setOptions({ tabId, enabled: false })
        } catch {
          // ignore
        }
      }

      // Window-scoped path only — tab-scoped setOptions breaks close on extension-page tabs.
      await chrome.sidePanel.setOptions({ path, enabled: true })

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
      const mode = options?.mode ?? "approval"
      const navigated = await this.navigateSidePanel(argument, mode, {
        approvalSiteUrl: options?.approvalSiteUrl,
      })

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
