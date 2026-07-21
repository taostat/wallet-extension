import { NAVIGATE_SIDE_PANEL_MESSAGE } from "extension-shared"
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"

/** Navigates the side panel when approval requests arrive while it is already open. */
export const SidePanelNavigationListener = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const handler = (message: { type?: string; hash?: string }) => {
      if (message.type !== NAVIGATE_SIDE_PANEL_MESSAGE || !message.hash) return

      const path = message.hash.replace(/^#/, "")
      navigate(path.startsWith("/") ? path : `/${path}`, { replace: true })
    }

    chrome.runtime.onMessage.addListener(handler)
    return () => chrome.runtime.onMessage.removeListener(handler)
  }, [navigate])

  return null
}
