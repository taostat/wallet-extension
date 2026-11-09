import { Loading01 } from "@untitledui/icons/Loading01"
import { useTranslation } from "react-i18next"
import { Modal, ModalDialog } from "taostats-ui"

import { statusOptions } from "@taostats/hooks/useStatus"

import { BackUpMnemonicDialog } from "./BackUpMnemonicDialog"
import { MigratePasswordProvider, useMigratePassword } from "./context"
import { EnterPasswordForm } from "./EnterPassword"
import { MigratePasswordError } from "./Error"
import { NewPasswordForm } from "./NewPasswordForm"
import { MigratePasswordSuccess } from "./Success"
import { useMigratePasswordModal } from "./useMigratePasswordModal"

const MigratePasswordModalContent = () => {
  const { t } = useTranslation()
  const { hasPassword, hasBackedUpMnemonic, passwordTrimmed, hasNewPassword, status } =
    useMigratePassword()
  if (status === statusOptions.PROCESSING)
    return (
      <ModalDialog title={t("Please wait...")}>
        <Loading01 className="text-secondary animate-spin-slow mx-auto h-6 w-6" />
      </ModalDialog>
    )
  if (status === statusOptions.SUCCESS) return <MigratePasswordSuccess />
  if (status === statusOptions.ERROR) return <MigratePasswordError />

  if (!hasPassword) return <EnterPasswordForm />
  if (!hasBackedUpMnemonic) return <BackUpMnemonicDialog />
  if (passwordTrimmed) {
    if (!hasNewPassword) return <NewPasswordForm />
  }
  return null
}

export const MigratePasswordModal = () => {
  const { isOpen, close } = useMigratePasswordModal()

  return (
    <Modal isOpen={isOpen} onDismiss={close}>
      <div className="w-[503px]">
        <MigratePasswordProvider onComplete={close}>
          <MigratePasswordModalContent />
        </MigratePasswordProvider>
      </div>
    </Modal>
  )
}
