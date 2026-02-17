import { isNetworkDot } from "@taostats-wallet/chaindata-provider"
import { isAccountAddressSs58 } from "extension-core"
import { FC, PropsWithChildren, ReactNode, Suspense, useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useMatch, useNavigate } from "react-router-dom"
import { Button } from "taostats-ui"

import { SuspenseTracker } from "@taostats/components/SuspenseTracker"
import { AccountPortfolioSummary } from "@ui/domains/Portfolio/AccountPortfolioSummary"
import { DashboardPortfolioHeader } from "@ui/domains/Portfolio/DashboardPortfolioHeader"
import { GetStarted } from "@ui/domains/Portfolio/GetStarted/GetStarted"
import { PortfolioTabs } from "@ui/domains/Portfolio/PortfolioTabs"
import { usePortfolioNavigation } from "@ui/domains/Portfolio/usePortfolioNavigation"
import { usePortfolioGlobalData } from "@ui/state"

const EnableNetworkMessage: FC<{ type?: "substrate" | "evm" }> = ({ type }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const handleClick = useCallback(() => {
    if (type === "substrate") navigate("/settings/networks-tokens/networks/polkadot")
    else if (type === "evm") navigate("/settings/networks-tokens/networks/ethereum")
    else navigate("/settings/networks-tokens/networks")
  }, [navigate, type])

  return (
    <div className="text-body-secondary mt-72 flex flex-col items-center justify-center gap-8 text-center">
      <div>{t("Enable some networks to display your assets")}</div>
      <div>
        <Button onClick={handleClick} primary small type="button">
          {t("Manage Networks")}
        </Button>
      </div>
    </div>
  )
}

const PortfolioAccountCheck: FC<PropsWithChildren> = ({ children }) => {
  const { networks } = usePortfolioGlobalData()
  const { selectedAccounts } = usePortfolioNavigation()

  const [chains] = useMemo(() => {
    const chains = networks.filter(isNetworkDot)
    return [chains]
  }, [networks])

  const [hasOnlySs58Accounts] = useMemo(
    () => [!!selectedAccounts.length && selectedAccounts.every((a) => isAccountAddressSs58(a))],
    [selectedAccounts],
  )

  if (!selectedAccounts.length) return <GetStarted />
  if (!networks.length) return <EnableNetworkMessage />
  if (hasOnlySs58Accounts && !chains.length) return <EnableNetworkMessage type="substrate" />

  return <>{children}</>
}

export const PortfolioLayout: FC<
  PropsWithChildren & { toolbar?: ReactNode; header?: ReactNode }
> = ({ header, toolbar, children }) => {
  const isTokenDetailRoute = !!useMatch("/portfolio/tokens/:netuid")

  return (
    // "-mx-4 px-4" allows for portfolio staking badges to overflow, while keeping a consistant width limit and keep content centered
    <div className="-mx-4 w-full px-4">
      <div className="relative flex w-full flex-col gap-6">
        <Suspense
          fallback={<SuspenseTracker name="DashboardPortfolioLayout.PortfolioAccountCheck" />}
        >
          {header ?? <DashboardPortfolioHeader />}
          <PortfolioAccountCheck>
            {!isTokenDetailRoute && <AccountPortfolioSummary />}
            <div className="flex h-16 w-full items-center justify-between gap-8 overflow-hidden">
              <PortfolioTabs className="text-md my-0 h-14 w-auto font-bold" />
              <div className="shrink-0">
                <Suspense fallback={<SuspenseTracker name="DashboardPortfolioLayout.Toolbar" />}>
                  {toolbar}
                </Suspense>
              </div>
            </div>
            <Suspense fallback={<SuspenseTracker name="DashboardPortfolioLayout.TabContent" />}>
              {children}
            </Suspense>
          </PortfolioAccountCheck>
        </Suspense>
      </div>
    </div>
  )
}
