import { classNames, isTruthy } from "@taostats-wallet/util"
import { Calendar } from "@untitledui/icons/Calendar"
import { Settings01 } from "@untitledui/icons/Settings01"
import { FC, ReactNode, Suspense, useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { matchPath, useLocation, useNavigate, useSearchParams } from "react-router-dom"
import { PillButton } from "taostats-ui"

import { SuspenseTracker } from "@taostats/components/SuspenseTracker"
import { TaostatsIcon, TaostatsLogo } from "@taostats/theme/logos"
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
        <div className={classNames("flex w-full items-center py-2", RESPONSIVE_FLEX_SPACING)}>
          <div className="hidden w-[296px] shrink-0 items-center gap-2 sm:flex">
            <TaostatsLogo className="h-[30px] w-[147.172px]" />
            <PillButton className="bg-fg-brand/5 text-fg-brand hover:bg-fg-brand/20 rounded-3xl">
              <div className="flex items-center gap-1">
                <span>Wallet</span>
              </div>
            </PillButton>
          </div>
          <div className="flex w-full grow items-center justify-end px-4">
            <HorizontalNav />
          </div>
        </div>
      </div>
      <div className="border-primary/6 h-px w-full shrink-0 border-b" />
      <div className="relative mx-auto w-full max-w-[1440px]">
        <div className={classNames("flex w-full pt-8", RESPONSIVE_FLEX_SPACING)}>
          {/* Sidebar */}
          <div className="w-[296px] shrink-0 pb-10">
            <Suspense fallback={<SuspenseTracker name="DashboardMainLayout.Sidebar" />}>
              {sidebar === "accounts" && <DashboardAccountsSidebar />}
              {sidebar === "settings" && <DashboardSettingsSidebar />}
            </Suspense>
          </div>
          {/* Main area */}
          <div className="grow pb-10">
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
        "font-mono-num group inline-flex shrink-0 cursor-pointer items-center justify-center overflow-hidden font-medium uppercase no-underline transition-colors",
        "focus-visible:ring-ring focus-visible:ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        "h-4xl px-lg py-md gap-md rounded-sm text-sm leading-5",
        "border",
        routeMatch
          ? "border-fg-brand bg-brand-secondary text-fg-brand"
          : "text-fg-tertiary hover:text-fg-primary border-transparent bg-transparent",
        className,
      )}
      onClick={onClick}
    >
      <Icon
        className={classNames(
          "h-[12px] w-[12px] shrink-0 transition-colors",
          routeMatch ? "text-fg-brand" : "text-fg-tertiary group-hover:text-fg-primary",
        )}
      />
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
    <div className="gap-md flex items-center">
      <NavButton
        label={t("Home")}
        onClick={handlePortfolioClick}
        icon={TaostatsIcon}
        route="/portfolio/*"
      />
      <NavButton
        label={t("History")}
        onClick={handleActivityClick}
        icon={Calendar}
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
