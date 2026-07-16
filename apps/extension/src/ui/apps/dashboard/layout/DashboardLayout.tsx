import { HistoryIcon } from "@taostats-wallet/icons"
import { classNames, isTruthy } from "@taostats-wallet/util"
import { Home01 } from "@untitledui/icons/Home01"
import { Settings01 } from "@untitledui/icons/Settings01"
import { FC, ReactNode, Suspense, useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { matchPath, useLocation, useNavigate, useSearchParams } from "react-router-dom"
import { PillButton } from "taostats-ui"

import { SuspenseTracker } from "@taostats/components/SuspenseTracker"
import { TaostatsLogo } from "@taostats/theme/logos"
import { AnalyticsPage, sendAnalyticsEvent } from "@ui/api/analytics"

import { DashboardAccountsSidebar } from "./DashboardAccountsSidebar"
import { DashboardSettingsSidebar } from "./DashboardSettingsSidebar"
import { LayoutBreadcrumb } from "./LayoutBreadcrumb"
import { DashboardNotificationsAndModals } from "./notifications/DashboardNotificationsAndModals"

// dynamic max height to apply on sidebar : max-h-[calc(100dvh-13.6rem)]
export const DashboardLayout: FC<{
  children?: ReactNode
  sidebar: "accounts" | "settings"
}> = ({ children, sidebar }) => {
  return (
    <div id="main" className="h-dvh w-dvw overflow-x-auto overflow-y-scroll">
      <div className="relative mx-auto w-full max-w-[1440px]">
        <div className={classNames("flex w-full", RESPONSIVE_FLEX_SPACING)}>
          {/* Sidebar */}
          <div className="w-[296px] shrink-0 pb-10">
            <div className="hidden h-24 w-[296px] shrink-0 items-center gap-2 sm:flex">
              <TaostatsLogo className="h-[30px] w-[147.172px]" />
              <PillButton className="bg-fg-brand/5 text-fg-brand hover:bg-fg-brand/20 rounded-3xl">
                <div className="flex items-center gap-1">
                  <span>Wallet</span>
                </div>
              </PillButton>
            </div>
            <Suspense fallback={<SuspenseTracker name="DashboardMainLayout.Sidebar" />}>
              {sidebar === "accounts" && <DashboardAccountsSidebar />}
              {sidebar === "settings" && <DashboardSettingsSidebar />}
            </Suspense>
          </div>
          {/* Main area */}
          <div className="grow pb-10">
            <div className="flex w-full flex-col items-center">
              <div className="flex h-24 w-full shrink-0 items-center justify-end px-4">
                <HorizontalNav />
              </div>
              <Suspense fallback={<SuspenseTracker name="DashboardMainLayout.Content" />}>
                <div
                  className={classNames(
                    // minimum width is automatically set by the horizontal nav bar which never shrinks
                    "animate-fade-in w-full grow",
                  )}
                >
                  <LayoutBreadcrumb />
                  {children}
                </div>
              </Suspense>
            </div>
          </div>
        </div>
      </div>
      <DashboardNotificationsAndModals />
    </div>
  )
}

const RESPONSIVE_FLEX_SPACING = classNames("gap-4 px-2.5", "md:px-5", "lg:px-10", "xl:px-16")

const NavButton: FC<{
  label: ReactNode
  icon: FC<{ className?: string }>
  route?: string | string[]
  className?: string
  onClick: () => void
}> = ({ label, icon: Icon, route, className, onClick }) => {
  const location = useLocation()
  const routeMatch = useMemo(() => {
    const matches = Array.isArray(route) ? route : [route].filter(isTruthy)
    return matches.some((route) => matchPath(route, location.pathname))
  }, [location.pathname, route])

  return (
    <button
      type="button"
      className={classNames(
        "text-fg-tertiary hover:text-fg-secondary flex items-center gap-2",
        routeMatch && "!text-fg-brand",
        className,
      )}
      onClick={onClick}
    >
      <Icon className="shrink-0 text-[20px]" />
      <div>{label}</div>
    </button>
  )
}

const ANALYTICS_PAGE: AnalyticsPage = {
  container: "Fullscreen",
  feature: "Navigation",
  featureVersion: 3,
  page: "Portfolio",
}

const HorizontalNav = () => {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()

  const navigate = useNavigate()
  const handlePortfolioClick = useCallback(() => {
    sendAnalyticsEvent({
      ...ANALYTICS_PAGE,
      name: "Goto",
      action: "Portfolio button",
    })
    navigate("/portfolio/tokens" + (searchParams.size ? `?${searchParams}` : ""))
  }, [navigate, searchParams])

  const handleActivityClick = useCallback(() => {
    sendAnalyticsEvent({
      ...ANALYTICS_PAGE,
      name: "Goto",
      action: "Activity button",
    })
    navigate("/tx-history" + (searchParams.size ? `?${searchParams}` : ""))
  }, [navigate, searchParams])

  const handleSettingsClick = useCallback(() => {
    sendAnalyticsEvent({
      ...ANALYTICS_PAGE,
      name: "Goto",
      action: "Settings button",
    })
    navigate("/settings/general")
  }, [navigate])

  return (
    <div className="border-primary flex h-12 gap-8 rounded-lg border px-4">
      <NavButton
        label={t("Home")}
        onClick={handlePortfolioClick}
        icon={Home01}
        route="/portfolio/*"
      />
      <NavButton
        label={t("History")}
        onClick={handleActivityClick}
        icon={HistoryIcon}
        route="/tx-history"
      />
      <NavButton
        label={t("Settings")}
        onClick={handleSettingsClick}
        icon={Settings01}
        route={["/settings/*", "/accounts/*"]}
      />
    </div>
  )
}
