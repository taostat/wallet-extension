import { classNames } from "@taostats-wallet/util"
import { ChevronLeft } from "@untitledui/icons/ChevronLeft"
import { X } from "@untitledui/icons/X"
import { Suspense, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { IconButton, Modal } from "taostats-ui"

import { SuspenseTracker } from "@taostats/components/SuspenseTracker"

import { ModalContent } from "../shared/ModalContent"
import { useStakeModal } from "./hooks/useStakeModal"
import { useStakeWizard } from "./hooks/useStakeWizard"
import { StakeFollowUp } from "./StakeFollowUp"
import { StakeForm } from "./StakeForm"
import { StakeReview } from "./StakeReview"

const ModalHeader = () => {
  const { t } = useTranslation()
  const { step, setStep } = useStakeWizard()
  const { close } = useStakeModal()

  const handleBackClick = useCallback(() => setStep("form"), [setStep])

  return (
    <div
      className={classNames(
        "text-fg-secondary flex min-h-16 w-full shrink-0 items-center justify-between px-5",
        step === "follow-up" ? "invisible" : "visible",
      )}
    >
      <IconButton
        onClick={handleBackClick}
        className={classNames(step === "review" ? "block" : "hidden")}
      >
        <ChevronLeft />
      </IconButton>
      <div>
        {step === "form" && <span className="text-fg-primary font-bold">{t("Staking")}</span>}
        {step === "review" && t("Confirm")}
      </div>
      <IconButton onClick={close}>
        <X />
      </IconButton>
    </div>
  )
}

const ModalBody = () => {
  const { step } = useStakeWizard()

  switch (step) {
    case "form":
      return <StakeForm />
    case "review":
      return <StakeReview />
    case "follow-up":
      return <StakeFollowUp />
  }
}

export const StakeModal = () => {
  const { isOpen, close } = useStakeModal()

  return (
    <Modal containerId="main" isOpen={isOpen} onDismiss={close}>
      <Suspense fallback={<SuspenseTracker name="NomPoolStakeModal" />}>
        <ModalContent ModalHeader={ModalHeader} ModalBody={ModalBody} />
      </Suspense>
    </Modal>
  )
}
