import { isNetworkDot } from "@taostats-wallet/chaindata-provider"
import { isAccountAddressSs58 } from "extension-core"
import { FC, Suspense, useCallback, useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useMatch, useNavigate } from "react-router-dom"
import { Button } from "taostats-ui"

import { SuspenseTracker } from "@taostats/components/SuspenseTracker"
import { api } from "@ui/api"
import { DashboardAssetsTable } from "@ui/domains/Portfolio/AssetsTable"
import { DashboardPortfolioHeader } from "@ui/domains/Portfolio/DashboardPortfolioHeader"
import { PortfolioToolbarTokens } from "@ui/domains/Portfolio/PortfolioToolbarTokens"
import { usePortfolioNavigation } from "@ui/domains/Portfolio/usePortfolioNavigation"
import { useAnalytics } from "@ui/hooks/useAnalytics"
import { usePortfolioGlobalData } from "@ui/state"
import { closeWalletSurface } from "@ui/util/closeWalletSurface"

const EnableNetworkMessage: FC<{ type?: "substrate" }> = ({ type }) => {
  const { t } = useTranslation()
  const handleClick = useCallback(() => {
    if (type === "substrate") api.dashboardOpen("/settings/networks-tokens/networks/polkadot")
    else api.dashboardOpen("/settings/networks-tokens/networks")
    void closeWalletSurface()
  }, [type])

  return (
    <div className="text-fg-secondary mt-[112px] flex flex-col items-center justify-center gap-4 text-center">
      <div>{t("Enable some networks to display your assets")}</div>
      <div>
        <Button onClick={handleClick} primary small type="button">
          {t("Manage Networks")}
        </Button>
      </div>
    </div>
  )
}

const PopupAnalyticsEvent: FC<{ name: string }> = ({ name }) => {
  const { popupOpenEvent } = useAnalytics()

  useEffect(() => {
    popupOpenEvent(name)
  }, [name, popupOpenEvent])

  return null
}

const MainContent: FC = () => {
  const { networks } = usePortfolioGlobalData()
  const { selectedAccount: account } = usePortfolioNavigation()

  const matchTokens = useMatch("/portfolio/tokens")

  const [chains] = useMemo(() => {
    const chains = networks.filter(isNetworkDot)
    return [chains]
  }, [networks])

  if (!account?.type && !networks.length) return <EnableNetworkMessage />
  if (isAccountAddressSs58(account) && !chains.length)
    return <EnableNetworkMessage type="substrate" />

  if (matchTokens)
    return (
      <>
        <DashboardAssetsTable />
        <PopupAnalyticsEvent name="portfolio assets" />
      </>
    )

  return null
}

export const PortfolioAssets = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const matchTokens = useMatch("/portfolio/tokens")

  const handleBack = useCallback(() => {
    navigate("/portfolio")
  }, [navigate])

  return (
    <div className="flex flex-col gap-3">
      <DashboardPortfolioHeader variant="popup" onBack={handleBack} />
      {!!matchTokens && <div className="border-primary w-full border-b" aria-hidden />}
      <Suspense fallback={<SuspenseTracker name="PortfolioAssets.TabContent" />}>
        {!!matchTokens && (
          <>
            <div className="px-2 w-full overflow-hidden">
              <Suspense fallback={<SuspenseTracker name="PortfolioAssets.Toolbar" />}>
                <PortfolioToolbarTokens />
              </Suspense>
            </div>
            <div className="text-fg-primary text-md px-2 font-medium">{t("Holdings")}</div>
          </>
        )}
        <div className="px-2">
          <MainContent />
        </div>
      </Suspense>
    </div>
  )
}
