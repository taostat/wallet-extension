const paintHoldScreen = () =>
  new Promise<void>((resolve) => {
    // rAF runs before paint. The timeout runs after that paint, so the hold screen
    // is on screen before the app bundle is parsed.
    requestAnimationFrame(() => {
      setTimeout(resolve, 0)
    })
  })

const bootstrap = async () => {
  await paintHoldScreen()

  await import("@common/enableAnyloggerLogsInDevelopment")
  await import("@common/i18nConfig")
  await import("@common/zodConfig")

  const { appStore } = await import("extension-core")
  const { IS_FIREFOX, log, SIDE_PANEL_VISIBILITY_MESSAGE } = await import("extension-shared")
  const { renderApp } = await import("@ui")
  const { default: Popup } = await import("@ui/apps/popup")
  const { detectWalletSurface, isFloatingPopup } = await import("@ui/util/constants")

  const adjustPopupSize = async () => {
    // on embedded popup, zoom is disabled and the frame automatically syncs with the size of content
    if (window.location.search === "?embedded") return

    if (!(await isFloatingPopup())) return

    try {
      const [currentWindow, currentZoom] = await Promise.all([
        chrome.windows.getCurrent(),
        chrome.tabs.getZoom(),
      ])

      // exit if popup is opened in a normal window (common for devs)
      if (currentWindow.type !== "popup") return

      // make sure zoom is reset before adjusting size or size will be incorrect
      // test the necessity to apply the zoom settings, otherwise a zoom update message would appear
      if (currentZoom !== 1) {
        if (IS_FIREFOX) await chrome.tabs.setZoom(1)
        else
          chrome.tabs.setZoomSettings({
            defaultZoomFactor: 1,
            mode: "disabled",
            scope: "per-tab",
          })
      }

      const { innerHeight, innerWidth, outerHeight, outerWidth } = window

      // check if adjusting the size is needed
      if (innerWidth === 400 && innerHeight === 600) return

      const deltaWidth = outerWidth - innerWidth
      const deltaHeight = outerHeight - innerHeight

      const width = 400 + deltaWidth
      const height = 600 + deltaHeight

      if (!(width > 0 && height > 0))
        throw new Error(`Invalid width (${width}) or height (${height})`)

      if (width !== window.outerWidth || height !== window.outerHeight) {
        chrome.windows.update(chrome.windows.WINDOW_ID_CURRENT, {
          width,
          height,
        })

        // store delta to open next popups at the right size
        await appStore.set({ popupSizeDelta: [deltaWidth, deltaHeight] })
      }
    } catch (cause) {
      log.error("Failed to adjust popup size", { cause })
    }
  }

  const notifySidePanelLifecycle = () => {
    if (!document.documentElement.classList.contains("side-panel")) return

    const sendVisibility = (visible: boolean) => {
      chrome.runtime.sendMessage({ type: SIDE_PANEL_VISIBILITY_MESSAGE, visible }).catch(() => {})
    }

    sendVisibility(document.visibilityState === "visible")

    document.addEventListener("visibilitychange", () => {
      sendVisibility(document.visibilityState === "visible")
    })
  }

  await detectWalletSurface()
  notifySidePanelLifecycle()

  const isEmbedded = window.location.search === "?embedded"
  const isFloating = await isFloatingPopup()

  // Keep wallet unlocked while side panel / embedded popup is open.
  const keepWalletUnlockedMode = isEmbedded || !isFloating ? "always" : "user-interaction"

  renderApp(<Popup />, { keepWalletUnlockedMode })

  if (isFloating) await adjustPopupSize()
}

void bootstrap()
