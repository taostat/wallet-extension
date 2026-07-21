export const IS_POPUP = typeof window !== "undefined" && window.location.pathname === "/popup.html"

export const IS_EMBEDDED_POPUP =
  IS_POPUP && new URLSearchParams(window.location.search).has("embedded")

export const IS_SIDE_PANEL =
  IS_POPUP &&
  !IS_EMBEDDED_POPUP &&
  typeof document !== "undefined" &&
  document.documentElement.classList.contains("side-panel")

export const detectWalletSurface = async () => {
  if (typeof document === "undefined") return

  const root = document.documentElement

  if (IS_EMBEDDED_POPUP) {
    root.classList.add("embedded-popup")
    return
  }

  try {
    const win = await chrome.windows.getCurrent()
    if (win.type === "popup") {
      root.classList.add("floating-popup")
      return
    }
  } catch {
    // ignore
  }

  root.classList.add("side-panel")
}

export const isFloatingPopup = async () => {
  if (IS_EMBEDDED_POPUP) return false

  try {
    const win = await chrome.windows.getCurrent()
    return win.type === "popup"
  } catch {
    return false
  }
}
