import { ChevronRight } from "@untitledui/icons/ChevronRight"
import { Clock } from "@untitledui/icons/Clock"
import { Lock01 } from "@untitledui/icons/Lock01"
import { useTranslation } from "react-i18next"
import { CtaButton } from "taostats-ui"

import { HeaderBlock } from "@taostats/components/HeaderBlock"
import { Spacer } from "@taostats/components/Spacer"
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
      <div className="flex flex-col gap-2">
        <CtaButton
          iconLeft={Lock01}
          iconRight={ChevronRight}
          title={t("Change password")}
          subtitle={
            allBackedUp
              ? t("Change your Taostats password")
              : t("Please back up your recovery phrase before you change your password.")
          }
          to={`/settings/security-privacy-settings/change-password`}
          disabled={!allBackedUp}
        />
        <CtaButton
          iconLeft={Clock}
          iconRight={ChevronRight}
          title={t("Auto-lock timer")}
          subtitle={t("Set a timer to automatically lock your Taostats wallet")}
          to={`/settings/security-privacy-settings/autolock`}
        />
      </div>
    </>
  )
}

export const SecurityPrivacyPage = () => <Content />
