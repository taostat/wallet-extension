import { classNames } from "@taostats-wallet/util"
import { ScrollContainer } from "@taostats/components/ScrollContainer"
import { SuspenseTracker } from "@taostats/components/SuspenseTracker"
import { TaostatsLogo } from "@taostats/theme/logos"
import { FC, PropsWithChildren, Suspense, useEffect, useRef } from "react"
import { Route, Routes, useLocation } from "react-router-dom"

import { PortfolioContainer } from "@ui/domains/Portfolio/PortfolioContainer"
import BraveWarningPopupBanner from "@ui/domains/Settings/BraveWarning/BraveWarningPopupBanner"
import MigratePasswordAlert from "@ui/domains/Settings/MigratePasswordAlert"

import { BottomNav } from "../../components/Navigation/BottomNav"
import { NavigationDrawer } from "../../components/Navigation/NavigationDrawer"
import { PortfolioAccounts } from "./PortfolioAccounts"
import { PortfolioAsset } from "./PortfolioAsset"
import { PortfolioAssets } from "./PortfolioAssets"

const PortfolioRoutes = () => (
  <>
    <Routes>
      <Route path="tokens" element={<PortfolioAssets />} />
      <Route path="tokens/:symbol" element={<PortfolioAsset />} />
      <Route path="*" element={<PortfolioAccounts />} />
    </Routes>
    <Suspense fallback={<SuspenseTracker name="HasAccountsPortfolioContent" />}>
      <BraveWarningPopupBanner />
      <MigratePasswordAlert />
    </Suspense>
  </>
)

const Content: FC<PropsWithChildren> = ({ children }) => {
  //scrollToTop on location change
  const scrollableRef = useRef<HTMLDivElement>(null)
  const location = useLocation()

  useEffect(() => {
    scrollableRef.current?.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <ScrollContainer ref={scrollableRef} className={classNames("size-full overflow-hidden px-8")}>
      {children}
    </ScrollContainer>
  )
}

export const Portfolio = () => (
  <PortfolioContainer renderWhileLoading>
    <div id="main" className="relative size-full overflow-hidden">
      <Content>
        <div className="flex size-full flex-col gap-4 py-8">
          <header className="flex items-center justify-between p-4 pt-0">
            <TaostatsLogo className="h-[1.5rem] w-auto" />
          </header>
          <PortfolioRoutes />
          <BottomNav />
        </div>
      </Content>
      <NavigationDrawer />
    </div>
  </PortfolioContainer>
)
