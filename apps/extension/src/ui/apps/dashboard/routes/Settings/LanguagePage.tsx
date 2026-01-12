import { ExclusiveButtonsList } from "@taostats/components/ExclusiveButtonsList"
import { HeaderBlock } from "@taostats/components/HeaderBlock"
import { Spacer } from "@taostats/components/Spacer"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { languages } from "@common/i18nConfig"
import { DashboardLayout } from "@ui/apps/dashboard/layout"

const Content = () => {
  const { t, i18n } = useTranslation()

  const options = useMemo(
    () => Object.entries(languages).map(([value, label]) => ({ value, label })),
    [],
  )

  return (
    <>
      <HeaderBlock title={t("Language")} text={t("Choose your preferred language")} />
      <Spacer />
      <ExclusiveButtonsList
        options={options}
        value={i18n.language}
        onChange={i18n.changeLanguage}
      />
      <Spacer />
    </>
  )
}

export const LanguagePage = () => (
  <DashboardLayout sidebar="settings">
    <Content />
  </DashboardLayout>
)
