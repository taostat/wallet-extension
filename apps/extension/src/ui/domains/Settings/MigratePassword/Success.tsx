import { CheckCircle } from "@untitledui/icons/CheckCircle"
import { useTranslation } from "react-i18next"
import { Button, ModalDialog } from "taostats-ui"

import { useMigratePassword } from "./context"

export const MigratePasswordSuccess = () => {
  const { t } = useTranslation()
  const { onComplete } = useMigratePassword()
  return (
    <ModalDialog title={t("Security Upgrade Complete")}>
      <CheckCircle className="text-fg-brand h-6 w-6" />

      <Button onClick={onComplete} fullWidth>
        {t("Close")}
      </Button>
    </ModalDialog>
  )
}
