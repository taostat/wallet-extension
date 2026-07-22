import { AnalyticsPage } from "@ui/api/analytics"
import { useAnalyticsPageView } from "@ui/hooks/useAnalyticsPageView"

import { SettingsMenu } from "../../components/Navigation/SettingsMenu"
import { TaoPriceHeader } from "../../components/TaoPriceHeader"
import { PopupTabPage } from "../../Layout/PopupTabShell"

const ANALYTICS_PAGE: AnalyticsPage = {
  container: "Popup",
  feature: "Navigation",
  featureVersion: 3,
  page: "Settings",
}

export const SettingsPage = () => {
  useAnalyticsPageView(ANALYTICS_PAGE)

  return (
    <PopupTabPage headerRight={<TaoPriceHeader />} contentClassName="overflow-y-auto">
      <SettingsMenu />
    </PopupTabPage>
  )
}
