import { BraveIcon } from "@taostats-wallet/icons"
import { useIsBrave } from "@taostats/hooks/useIsBrave"
import { useOpenClose } from "@taostats/hooks/useOpenClose"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Modal, ModalDialog } from "taostats-ui"

import { BraveWarningModal } from "@ui/domains/Settings/BraveWarning/BraveWarningModal"
import { useAppState } from "@ui/state"

import { DashboardNotification } from "./DashboardNotification"

export const BraveWarningNotification = () => {
  const { t } = useTranslation()
  const isBrave = useIsBrave()
  const [hideBraveWarning, setHideBraveWarning] = useAppState("hideBraveWarning")
  const { isOpen, close, open } = useOpenClose()

  const showWarning = useMemo(() => isBrave && !hideBraveWarning, [hideBraveWarning, isBrave])

  const handleHide = useCallback(() => {
    setHideBraveWarning(true)
  }, [setHideBraveWarning])

  if (!showWarning) return null

  return (
    <>
      <DashboardNotification
        icon={<BraveIcon className="icon" />}
        title={t("Attention Brave users.")}
        description={t("By default, Brave prevents Taostats Wallet from loading all balances.")}
        action={t("Learn how to fix")}
        onActionClick={open}
        onClose={handleHide}
      />
      <Modal isOpen={isOpen} onDismiss={close}>
        <ModalDialog centerTitle title={t("Attention Brave Users")} onClose={close}>
          <BraveWarningModal />
        </ModalDialog>
      </Modal>
    </>
  )
}
