import { cn } from "@taostats-wallet/util"
import { Suspense } from "react"
import { Modal } from "taostats-ui"

import { SuspenseTracker } from "@taostats/components/SuspenseTracker"
import { IS_POPUP } from "@ui/util/constants"

import { STAKING_MODAL_CONTENT_CONTAINER_ID } from "../../shared/ModalContent"
import { useBittensorStakeModal } from "../hooks/useBittensorStakeModal"
import { BittensorStakeWizardProvider } from "../hooks/useBittensorStakeWizard"
import { BittensorStakeModalRouter } from "./Forms"

export const BittensorStakeModal = () => {
  const { isOpen, close } = useBittensorStakeModal()

  return (
    <Modal containerId="main" isOpen={isOpen} onDismiss={close}>
      <div
        id={STAKING_MODAL_CONTENT_CONTAINER_ID} // acts as containerId for sub modals & drawers
        className={cn(
          "relative flex h-[60rem] max-h-[100dvh] w-[40rem] max-w-[100dvw] flex-col overflow-hidden bg-black",
          !IS_POPUP && "border-grey-850 rounded border",
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
