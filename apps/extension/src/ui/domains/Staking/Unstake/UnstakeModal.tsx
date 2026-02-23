import { XIcon } from "@taostats-wallet/icons"
import { classNames } from "@taostats-wallet/util"
import { Suspense } from "react"
import { useTranslation } from "react-i18next"
import { IconButton, Modal } from "taostats-ui"

import { SuspenseTracker } from "@taostats/components/SuspenseTracker"
import { IS_POPUP } from "@ui/util/constants"

import { UnstakeFollowUp } from "./UnstakeFollowUp"
import { UnstakeReview } from "./UnstakeReview"
import { useUnstakeModal } from "./useUnstakeModal"
import { useUnstakeWizard } from "./useUnstakeWizard"

const ModalHeader = () => {
  const { t } = useTranslation()
  const { step } = useUnstakeWizard()
  const { close } = useUnstakeModal()

  return (
    <div
      className={classNames(
        "text-body-secondary flex h-32 w-full shrink-0 items-center justify-between px-10",
        step === "follow-up" ? "invisible" : "visible",
      )}
    >
      <div>{step === "review" && t("Unstake")}</div>
      <IconButton onClick={close}>
        <XIcon />
      </IconButton>
    </div>
  )
}

const ModalContent = () => {
  const { step } = useUnstakeWizard()

  switch (step) {
    case "review":
      return <UnstakeReview />
    case "follow-up":
      return <UnstakeFollowUp />
  }
}

const Content = () => (
  <div
    id="StakingModalDialog" // acts as containerId for sub modals
    className={classNames(
      "relative flex h-[60rem] max-h-[100dvh] w-[40rem] max-w-[100dvw] flex-col overflow-hidden bg-black",
      !IS_POPUP && "border-grey-850 rounded border",
    )}
  >
    <ModalHeader />
    <div className="grow p-12 pt-0">
      <ModalContent />
    </div>
  </div>
)

export const UnstakeModal = () => {
  const { isOpen, close } = useUnstakeModal()

  return (
    <Modal containerId="main" isOpen={isOpen} onDismiss={close}>
      <Suspense fallback={<SuspenseTracker name="UnstakeModal" />}>
        <Content />
      </Suspense>
    </Modal>
  )
}
