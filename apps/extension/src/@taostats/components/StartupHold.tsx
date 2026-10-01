import { useLayoutEffect } from "react"

import { TaostatsLogo } from "@taostats/theme/logos"

/** Removes the pre-React hold screen once React has something to show. */
export const DismissStartupHold = () => {
  useLayoutEffect(() => {
    document.getElementById("startup-hold")?.remove()
  }, [])

  return null
}

/**
 * Shown while the wallet waits on the background script.
 * The popup HTML paints the same screen before React starts; this replaces it.
 */
export const StartupHold = () => (
  <>
    <DismissStartupHold />
    <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center gap-4 bg-[#121212]">
      <TaostatsLogo className="h-auto w-[153px]" />
      <p className="m-0 text-sm text-[#a1a1a1]">Please wait a moment...</p>
    </div>
  </>
)
