import { ChevronRightIcon, ClockIcon, LockIcon } from "@taostats-wallet/icons"
import { HeaderBlock } from "@taostats/components/HeaderBlock"
import { Spacer } from "@taostats/components/Spacer"
import { useTranslation } from "react-i18next"
import { CtaButton } from "taostats-ui"

import { DashboardLayout } from "@ui/apps/dashboard/layout"
import { useMnemonicsAllBackedUp } from "@ui/hooks/useMnemonicsAllBackedUp"

const Content = () => {
  const { t } = useTranslation()

  const allBackedUp = useMnemonicsAllBackedUp()

  return (
    <>
      <HeaderBlock
        title={t("Security and Privacy")}
        text={t("Control security and privacy preferences")}
      />
      <Spacer large />
      <div className="flex flex-col gap-4">
        <CtaButton
          iconLeft={LockIcon}
          iconRight={ChevronRightIcon}
          title={t("Change password")}
          subtitle={
            allBackedUp
              ? t("Change your Talisman password")
              : t("Please back up your recovery phrase before you change your password.")
          }
          to={`/settings/security-privacy-settings/change-password`}
          disabled={!allBackedUp}
        />
        <CtaButton
          iconLeft={ClockIcon}
          iconRight={ChevronRightIcon}
          title={t("Auto-lock timer")}
          subtitle={t("Set a timer to automatically lock your Talisman wallet")}
          to={`/settings/security-privacy-settings/autolock`}
        />
      </div>
    </>
  )
}

export const SecurityPrivacyPage = () => (
  <DashboardLayout sidebar="settings">
    <Content />
  </DashboardLayout>
)
