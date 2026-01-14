import { ExternalLinkIcon, HelpCircleIcon } from "@taostats-wallet/icons"
import { HeaderBlock } from "@taostats/components/HeaderBlock"
import { DISCORD_URL } from "extension-shared"
import { useTranslation } from "react-i18next"
import { CtaButton } from "taostats-ui"

import { DashboardLayout } from "@ui/apps/dashboard/layout"

const Content = () => {
  const { t } = useTranslation()
  return (
    <>
      <HeaderBlock title={t("Support")} />
      <div className="mt-6 flex flex-col gap-4">
        <CtaButton
          title={t("Help and Support")}
          subtitle={t("For help and support please visit our Discord")}
          to={DISCORD_URL}
          iconLeft={HelpCircleIcon}
          iconRight={ExternalLinkIcon}
        />
      </div>
    </>
  )
}

export const SupportPage = () => (
  <DashboardLayout sidebar="settings">
    <Content />
  </DashboardLayout>
)
