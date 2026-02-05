import { bind } from "@react-rxjs/core"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useLocation, useNavigate } from "react-router-dom"
import { combineLatest } from "rxjs"

import { HeaderBlock } from "@taostats/components/HeaderBlock"
import { SearchInput } from "@taostats/components/SearchInput"
import { Spacer } from "@taostats/components/Spacer"
import { TogglePill } from "@taostats/components/TogglePill"
import { DashboardLayout } from "@ui/apps/dashboard/layout"
import { useAnalyticsPageView } from "@ui/hooks/useAnalyticsPageView"
import { activeNetworksState$, balancesHydrate$ } from "@ui/state"

import { ANALYTICS_PAGE } from "./analytics"
import { NetworksList } from "./NetworksList"

export const NetworksPage = () => {
  const { t } = useTranslation()
  usePreload()

  useAnalyticsPageView(ANALYTICS_PAGE)

  return (
    <DashboardLayout sidebar="settings">
      <div className="flex w-full justify-between">
        <HeaderBlock title={t("Manage Networks")} text={<>{t("Enable and disable networks")}</>} />
      </div>
      <Content />
    </DashboardLayout>
  )
}

const [usePreload] = bind(combineLatest([balancesHydrate$, activeNetworksState$]))

const platform = "polkadot"

const Content = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()

  const [search, setSearch] = useState(() => (location.state?.search as string) ?? "")
  const [activeOnly, setActiveOnly] = useState(
    () => (location.state?.activeOnly as boolean) ?? false,
  )

  useEffect(() => {
    navigate(location.pathname, {
      replace: true,
      state: { platform, search, activeOnly },
    })
  }, [activeOnly, location.pathname, navigate, search])

  return (
    <>
      <Spacer small />
      <div className="flex justify-end gap-4" data-testid="platform-options-switch">
        <div className="flex-grow" />

        <TogglePill
          label={t("Active only")}
          checked={!search && activeOnly}
          onChange={() => setActiveOnly((prev) => !prev)}
          disabled={!!search}
        />
      </div>
      <Spacer small />
      <div className="flex gap-4">
        <SearchInput
          initialValue={search}
          onChange={setSearch}
          placeholder={t("Search networks")}
        />
      </div>
      <Spacer small />
      <NetworksList platform={platform} activeOnly={activeOnly} search={search} />
    </>
  )
}
