import { ChevronRight } from "@untitledui/icons/ChevronRight"
import { Globe01 } from "@untitledui/icons/Globe01"
import { List } from "@untitledui/icons/List"
import { useTranslation } from "react-i18next"
import { CtaButton } from "taostats-ui"

import { HeaderBlock } from "@taostats/components/HeaderBlock"
import { Spacer } from "@taostats/components/Spacer"
import { DashboardLayout } from "@ui/apps/dashboard/layout"

const Content = () => {
  const { t } = useTranslation()

  return (
    <>
      <HeaderBlock title={t("Networks & Tokens")} text={t("Manage networks and tokens")} />
      <Spacer large />
      <div className="flex flex-col gap-4">
        <CtaButton
          iconLeft={Globe01}
          iconRight={ChevronRight}
          title={t("Manage networks")}
          subtitle={t("Enable and disable networks")}
          to={`/settings/networks-tokens/networks`}
        />
        <CtaButton
          iconLeft={List}
          iconRight={ChevronRight}
          title={t("Manage tokens")}
          subtitle={t("Enable and disable tokens")}
          to={`/settings/networks-tokens/tokens`}
        />
      </div>
    </>
  )
}

export const NetworksTokensPage = () => (
  <DashboardLayout sidebar="settings">
    <Content />
  </DashboardLayout>
)
