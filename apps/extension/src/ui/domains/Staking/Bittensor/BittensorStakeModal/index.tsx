import { cn } from "@taostats-wallet/util"
import { Suspense, useEffect, useState } from "react"
import { Modal } from "taostats-ui"

import { SuspenseTracker } from "@taostats/components/SuspenseTracker"
import { IS_POPUP } from "@ui/util/constants"

import { STAKING_MODAL_CONTENT_CONTAINER_ID } from "../../shared/ModalContent"
import { useBittensorStakeModal } from "../hooks/useBittensorStakeModal"
import { BittensorStakeWizardProvider } from "../hooks/useBittensorStakeWizard"
import { BittensorStakeModalRouter } from "./Forms"

// `side-panel` is added after the first paint, once the window type is known.
const useIsSidePanel = () => {
  const [isSidePanelSurface, setIsSidePanelSurface] = useState(
    () =>
      typeof document !== "undefined" && document.documentElement.classList.contains("side-panel"),
  )

  useEffect(() => {
    const root = document.documentElement
    const update = () => setIsSidePanelSurface(root.classList.contains("side-panel"))
    update()
    const observer = new MutationObserver(update)
    observer.observe(root, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])

  return isSidePanelSurface
}

export const BittensorStakeModal = () => {
  const { isOpen, close } = useBittensorStakeModal()
  const isSidePanelSurface = useIsSidePanel()

  return (
    <Modal
      containerId="main"
      isOpen={isOpen}
      onDismiss={close}
      className={isSidePanelSurface ? "h-full w-full self-stretch" : undefined}
    >
      <div
        id={STAKING_MODAL_CONTENT_CONTAINER_ID} // acts as containerId for sub modals & drawers
        className={cn(
          "relative flex max-h-[100dvh] max-w-[100dvw] flex-col overflow-hidden bg-black",
          isSidePanelSurface ? "h-full w-full" : "h-[600px] w-[400px]",
          !IS_POPUP && !isSidePanelSurface && "border-primary rounded border",
        )}
      >
        <BittensorStakeWizardProvider>
          <Suspense fallback={<SuspenseTracker name="BittensorStakeModal" />}>
            <BittensorStakeModalRouter />
          </Suspense>
        </BittensorStakeWizardProvider>
      </div>
    </Modal>
  )
}
