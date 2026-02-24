import { ChevronLeftIcon, XIcon } from "@taostats-wallet/icons"
import { classNames } from "@taostats-wallet/util"
import { Suspense, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { IconButton, Modal } from "taostats-ui"

import { SuspenseTracker } from "@taostats/components/SuspenseTracker"

import { ModalContent } from "../shared/ModalContent"
import { StakeFollowUp } from "./StakeFollowUp"
import { StakeForm } from "./StakeForm"
import { StakeReview } from "./StakeReview"
import { useStakeModal } from "./hooks/useStakeModal"
import { useStakeWizard } from "./hooks/useStakeWizard"

const ModalHeader = () => {
  const { t } = useTranslation()
  const { step, setStep } = useStakeWizard()
  const { close } = useStakeModal()

  const handleBackClick = useCallback(() => setStep("form"), [setStep])

  return (
    <div
      className={classNames(
        "text-body-secondary flex min-h-32 w-full shrink-0 items-center justify-between px-10",
        step === "follow-up" ? "invisible" : "visible",
      )}
    >
      <IconButton
        onClick={handleBackClick}
        className={classNames(step === "review" ? "block" : "hidden")}
      >
        <ChevronLeftIcon />
      </IconButton>
      <div>
        {step === "form" && <span className="text-body font-bold">{t("Staking")}</span>}
        {step === "review" && t("Confirm")}
      </div>
      <IconButton onClick={close}>
        <XIcon />
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
