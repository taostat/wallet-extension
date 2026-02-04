import { useTranslation } from "react-i18next"

import { HeaderBlock } from "@taostats/components/HeaderBlock"
import { Spacer } from "@taostats/components/Spacer"
import { DashboardLayout } from "@ui/apps/dashboard/layout"
import { AccountAddDerivedForm } from "@ui/domains/Account/AccountAdd/AccountAddDerived/AccountAddDerivedForm"
import { useSelectAccountAndNavigate } from "@ui/hooks/useSelectAccountAndNavigate"

const Content = () => {
  const { t } = useTranslation()
  const { setAddress } = useSelectAccountAndNavigate("/portfolio")

  return (
    <>
      <HeaderBlock title={t(`Create a new Bittensor account`)} />
      <Spacer small />
      <AccountAddDerivedForm onSuccess={setAddress} />
    </>
  )
}

export const AccountAddDerivedPage = () => (
  <DashboardLayout sidebar="settings">
    <Content />
  </DashboardLayout>
)
