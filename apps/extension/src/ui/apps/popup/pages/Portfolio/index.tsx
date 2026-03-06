import { EyeIcon, EyeOffIcon } from "@taostats-wallet/icons"
import { classNames } from "@taostats-wallet/util"
import { FC, PropsWithChildren, Suspense, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { Route, Routes, useLocation } from "react-router-dom"
import { Tooltip, TooltipContent, TooltipTrigger } from "taostats-ui"

import { ScrollContainer } from "@taostats/components/ScrollContainer"
import { SuspenseTracker } from "@taostats/components/SuspenseTracker"
import { TaostatsLogo } from "@taostats/theme/logos"
import { PortfolioContainer } from "@ui/domains/Portfolio/PortfolioContainer"
// import BraveWarningPopupBanner from "@ui/domains/Settings/BraveWarning/BraveWarningPopupBanner"
import MigratePasswordAlert from "@ui/domains/Settings/MigratePasswordAlert"
import { useSetting } from "@ui/state"

import { BottomNav } from "../../components/Navigation/BottomNav"
import { NavigationDrawer } from "../../components/Navigation/NavigationDrawer"
import { PortfolioAccounts } from "./PortfolioAccounts"
import { PortfolioAsset } from "./PortfolioAsset"
import { PortfolioAssets } from "./PortfolioAssets"

const HideBalancesToggle = () => {
  const { t } = useTranslation()
  const [hideBalances, setHideBalances] = useSetting("hideBalances")

  return (
    <Tooltip placement="bottom-end">
      <TooltipTrigger asChild>
        <label
          htmlFor="showBalancesNav"
          className="relative inline-flex cursor-pointer items-center"
        >
          <input
            id="showBalancesNav"
            type="checkbox"
            className="peer sr-only"
            defaultChecked={!hideBalances}
            onChange={(e) => setHideBalances(!e.target.checked)}
          />
          <div
            className={classNames(
              "bg-grey-600 peer h-14 w-28 shrink-0 rounded-full",
              "peer-focus-visible:ring-body peer-focus:outline-none peer-focus-visible:ring-2",
            )}
          ></div>
          <div
            className={classNames(
              "absolute left-1 top-1 flex h-12 w-12",
              "bg-grey-800 rounded-full",
              "peer-checked:bg-primary transition peer-checked:translate-x-14",
            )}
          >
            <EyeIcon
              className={classNames(
                "absolute left-2 top-2 h-8 w-8",
                "text-body-black transition-opacity",
                hideBalances ? "opacity-0" : "opacity-100",
              )}
            />
            <EyeOffIcon
              className={classNames(
                "absolute left-2 top-2 h-8 w-8",
                "text-body transition-opacity",
                !hideBalances ? "opacity-0" : "opacity-100",
              )}
            />
          </div>
        </label>
      </TooltipTrigger>
      <TooltipContent>
        {hideBalances ? t("Balances: hidden") : t("Balances: visible")}
      </TooltipContent>
    </Tooltip>
  )
}

const PortfolioRoutes = () => (
  <>
    <Routes>
      <Route path="tokens" element={<PortfolioAssets />} />
      <Route path="tokens/:netuid" element={<PortfolioAsset />} />
      <Route path="*" element={<PortfolioAccounts />} />
    </Routes>
    <Suspense fallback={<SuspenseTracker name="HasAccountsPortfolioContent" />}>
      {/* <BraveWarningPopupBanner /> */}
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
            <HideBalancesToggle />
          </header>
          <PortfolioRoutes />
          <BottomNav />
        </div>
      </Content>
      <NavigationDrawer />
    </div>
  </PortfolioContainer>
)
