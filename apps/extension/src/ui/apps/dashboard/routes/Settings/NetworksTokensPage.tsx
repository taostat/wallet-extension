import { ChevronRightIcon, GlobeIcon, ListIcon } from "@taostats-wallet/icons"
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
          iconLeft={GlobeIcon}
          iconRight={ChevronRightIcon}
          title={t("Manage networks")}
          subtitle={t("Enable and disable networks")}
          to={`/settings/networks-tokens/networks`}
        />
        <CtaButton
          iconLeft={ListIcon}
          iconRight={ChevronRightIcon}
          title={t("Manage tokens")}
          subtitle={t("Enable and disable tokens")}
          to={`/settings/networks-tokens/tokens`}
        />
        {/* <CtaButton
          iconLeft={PolkadotVaultIcon}
          iconRight={ChevronRightIcon}
          title={t("Polkadot Vault metadata")}
          subtitle={t("Register networks on your Polkadot Vault device, or update their metadata")}
          to={`/settings/networks-tokens/qr-metadata`}
        /> */}
      </div>
    </>
  )
}

export const NetworksTokensPage = () => (
  <DashboardLayout sidebar="settings">
    <Content />
  </DashboardLayout>
)
