import { CheckCircleIcon } from "@taostats-wallet/icons"
import { useTranslation } from "react-i18next"
import { Button, ModalDialog } from "taostats-ui"

import { useMigratePassword } from "./context"

export const MigratePasswordSuccess = () => {
  const { t } = useTranslation()
  const { onComplete } = useMigratePassword()
  return (
    <ModalDialog title={t("Security Upgrade Complete")}>
      <CheckCircleIcon className="text-primary h-12 w-12" />

      <Button onClick={onComplete} fullWidth>
        {t("Close")}
      </Button>
    </ModalDialog>
  )
}
