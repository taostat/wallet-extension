import { classNames } from "@taostats-wallet/util"
import { Lock01 } from "@untitledui/icons/Lock01"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { Button, Drawer } from "taostats-ui"

import { Card } from "@taostats/components/Card"
import { api } from "@ui/api"
import { sendAnalyticsEvent } from "@ui/api/analytics"

import { useMigratePasswordModal } from "../Settings/MigratePassword/useMigratePasswordModal"

type Props = {
  className?: string
  onAccept: () => void
}

export const AlertCard = ({ className, onAccept }: Props) => {
  const { t } = useTranslation()
  return (
    <Card
      className={classNames("text-fg-secondary !rounded-b-none text-center", className)}
      title={
        <div className="flex flex-col items-center p-1">
          <Lock01 className="icon text-fg-brand inline-block p-0.5 text-3xl" />
          <div className="text-fg-primary mt-2">{t("Security Upgrade")}</div>
        </div>
      }
      description={
        <>
          <p className="text-sm">
            {t(
              "We’ve upgraded our security measures, including enhanced password encryption. You must upgrade now to continue using Taostats.",
            )}
          </p>
        </>
      }
      cta={
        <div className="flex w-full flex-col gap-2.5">
          <Button className="w-full" primary onClick={onAccept}>
            {t("Continue")}
          </Button>
        </div>
      }
    />
  )
}

const PasswordMigrationAlertPopupDrawer = () => {
  const { isOpen } = useMigratePasswordModal()

  const handleAccept = useCallback(() => {
    sendAnalyticsEvent({
      container: "Popup",
      feature: "Navigation",
      featureVersion: 3,
      page: "Portfolio",
      name: "Goto",
      action: "Migrate password button",
    })
    api.dashboardOpen("/settings")
  }, [])

  return (
    <Drawer isOpen={isOpen} anchor="bottom">
      <AlertCard onAccept={handleAccept} />
    </Drawer>
  )
}

// use default export to enable lazy loading
export default PasswordMigrationAlertPopupDrawer
