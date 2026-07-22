import { classNames } from "@taostats-wallet/util"
import { Eye } from "@untitledui/icons/Eye"
import { EyeOff } from "@untitledui/icons/EyeOff"
import { Suspense } from "react"
import { useTranslation } from "react-i18next"
import { Route, Routes, useLocation } from "react-router-dom"
import { Tooltip, TooltipContent, TooltipTrigger } from "taostats-ui"

import { SuspenseTracker } from "@taostats/components/SuspenseTracker"
import { PortfolioContainer } from "@ui/domains/Portfolio/PortfolioContainer"
// import BraveWarningPopupBanner from "@ui/domains/Settings/BraveWarning/BraveWarningPopupBanner"
import MigratePasswordAlert from "@ui/domains/Settings/MigratePasswordAlert"
import { useSetting } from "@ui/state"

import { TaoPriceHeader } from "../../components/TaoPriceHeader"
import { PopupTabShell } from "../../Layout/PopupTabShell"
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
              "bg-tertiary peer h-7 w-14 shrink-0 rounded-full",
              "peer-focus-visible:ring-body peer-focus:outline-none peer-focus-visible:ring-2",
            )}
          ></div>
          <div
            className={classNames(
              "absolute left-0.5 top-0.5 flex h-6 w-6",
              "bg-secondary rounded-full",
              "peer-checked:bg-fg-brand transition peer-checked:translate-x-7",
            )}
          >
            <Eye
              className={classNames(
                "absolute left-1 top-1 h-4 w-4",
                "text-fg-primary-alt transition-opacity",
                hideBalances ? "opacity-0" : "opacity-100",
              )}
            />
            <EyeOff
              className={classNames(
                "absolute left-1 top-1 h-4 w-4",
                "text-fg-primary transition-opacity",
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

export const Portfolio = () => {
  const location = useLocation()
  const isTokenDetail = /\/portfolio\/tokens\/.+/.test(location.pathname)

  return (
    <PortfolioContainer renderWhileLoading>
      <div id="main" className="relative size-full overflow-hidden">
        <PopupTabShell
          headerRight={
            <>
              <TaoPriceHeader />
              {isTokenDetail && <HideBalancesToggle />}
            </>
          }
        >
          <PortfolioRoutes />
        </PopupTabShell>
      </div>
    </PortfolioContainer>
  )
}
