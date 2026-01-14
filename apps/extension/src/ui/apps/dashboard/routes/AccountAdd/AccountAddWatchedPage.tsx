import { HeaderBlock } from "@taostats/components/HeaderBlock"
import { Spacer } from "@taostats/components/Spacer"
import { useTranslation } from "react-i18next"

import { DashboardLayout } from "@ui/apps/dashboard/layout"
import { AccountAddWatchedForm } from "@ui/domains/Account/AccountAdd/AccountAddWatchedForm"
import { useSelectAccountAndNavigate } from "@ui/hooks/useSelectAccountAndNavigate"

export const Content = () => {
  const { t } = useTranslation()
  const { setAddress } = useSelectAccountAndNavigate("/portfolio")

  return (
    <>
      <HeaderBlock title={t(`Add a watched account`)} />
      <Spacer small />
      <AccountAddWatchedForm onSuccess={setAddress} />
    </>
  )
}

export const AccountAddWatchedPage = () => (
  <DashboardLayout sidebar="settings">
    <Content />
  </DashboardLayout>
)
