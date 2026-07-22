import { classNames } from "@taostats-wallet/util"
import { Calendar } from "@untitledui/icons/Calendar"
import { Expand04 } from "@untitledui/icons/Expand04"
import { Link01 } from "@untitledui/icons/Link01"
import { Menu04 } from "@untitledui/icons/Menu04"
import { XClose } from "@untitledui/icons/XClose"
import { TAOSTATS_WEB_APP_STAKING_URL } from "extension-shared"
import { FC, ReactNode, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { useLocation, useMatch, useNavigate } from "react-router-dom"

import { TaostatsIcon } from "@taostats/theme/logos"
import { api } from "@ui/api"
import { AnalyticsPage, sendAnalyticsEvent } from "@ui/api/analytics"
import { useMnemonicsAllBackedUp } from "@ui/hooks/useMnemonicsAllBackedUp"
import { closeWalletSurface } from "@ui/util/closeWalletSurface"

import {
  QuickSettingsModal,
  QuickSettingsOverlay,
  useQuickSettingsOpenClose,
} from "./QuickSettings"

const ANALYTICS_PAGE: AnalyticsPage = {
  container: "Popup",
  feature: "Navigation",
  featureVersion: 3,
  page: "Portfolio",
}

export const BottomNav = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { close: closeQuickSettings, isOpen: isQuickSettingsOpen } = useQuickSettingsOpenClose()

  const handleHomeClick = useCallback(() => {
    sendAnalyticsEvent({
      ...ANALYTICS_PAGE,
      name: "Goto",
      action: "Home button",
    })
    navigate("/portfolio")
    closeQuickSettings()
  }, [closeQuickSettings, navigate])

  const handleTxHistoryClick = useCallback(() => {
    sendAnalyticsEvent({
      ...ANALYTICS_PAGE,
      name: "Goto",
      action: "Recent activity button",
    })
    navigate("/tx-history")
    closeQuickSettings()
  }, [closeQuickSettings, navigate])

  const handleStakingClick = useCallback(() => {
    sendAnalyticsEvent({
      ...ANALYTICS_PAGE,
      name: "Goto",
      action: "Staking button",
    })
    window.open(TAOSTATS_WEB_APP_STAKING_URL, "_blank")
    void closeWalletSurface()
  }, [])

  const handleExpandClick = useCallback(() => {
    sendAnalyticsEvent({
      ...ANALYTICS_PAGE,
      name: "Goto",
      action: "Fullscreen button",
    })
    // assume paths are the same in dashboard
    // portfolio pages supports account/folder query string arguments to stay in sync with popup
    api.dashboardOpen(`${location.pathname}${location.search}`)
    void closeWalletSurface()
  }, [location.pathname, location.search])

  const handleSettingsClick = useCallback(() => {
    sendAnalyticsEvent({
      ...ANALYTICS_PAGE,
      name: "Goto",
      action: "Settings button",
    })
    navigate("/settings")
    closeQuickSettings()
  }, [closeQuickSettings, navigate])

  const allBackedUp = useMnemonicsAllBackedUp()

  const { t } = useTranslation()

  return (
    <>
      <div className="h-16 shrink-0">{/* Placeholder for nav height */}</div>
      <QuickSettingsOverlay />

      <div className="absolute bottom-0 left-0 z-20 flex w-full flex-col justify-center gap-3 px-4 pb-3">
        <QuickSettingsModal />
        <nav
          aria-label={t("Main navigation")}
          className="flex h-[52px] w-full items-center justify-between rounded-full border border-white/10 bg-[rgba(28,28,28,0.7)] px-1 shadow-[0px_8px_32px_0px_rgba(0,0,0,0.28),inset_0_1px_0_0_rgb(255_255_255/0.1)] backdrop-blur-sm backdrop-saturate-150"
        >
          <NavButton
            label={t("Home")}
            icon={TaostatsIcon}
            onClick={handleHomeClick}
            route="/portfolio/*"
          />
          <NavButton label={t("Staking")} icon={Link01} onClick={handleStakingClick} />
          <NavButton
            label={t("History")}
            icon={Calendar}
            onClick={handleTxHistoryClick}
            route="/tx-history"
          />
          <NavButton label={t("Full Screen")} icon={Expand04} onClick={handleExpandClick} />
          {isQuickSettingsOpen ? (
            <NavButton label={t("Close")} icon={XClose} onClick={closeQuickSettings} isActive />
          ) : (
            <NavButton
              label={t("More")}
              icon={Menu04}
              onClick={handleSettingsClick}
              route="/settings"
              withBadge={!allBackedUp}
            />
          )}
        </nav>
      </div>
    </>
  )
}

const NavButton: FC<{
  label: ReactNode
  icon: FC<{ className?: string }>
  iconClassName?: string
  isActive?: boolean
  withBadge?: boolean
  route?: string
  onClick: () => void
}> = ({ label, icon: Icon, iconClassName, isActive, withBadge, route, onClick }) => {
  const routeMatch = useMatch(route ?? "")

  return (
    <button
      type="button"
      aria-label={typeof label === "string" ? label : undefined}
      className={classNames(
        "relative flex h-10 w-[60px] shrink-0 items-center justify-center rounded-full transition-colors duration-500",
        routeMatch || isActive
          ? "text-fg-brand bg-white/10 shadow-[inset_0_1px_0_0_rgb(255_255_255/0.08)]"
          : "text-grayish hover:text-label-secondary hover:bg-white/[0.06]",
      )}
      onClick={onClick}
    >
      {withBadge ? (
        <div className="relative size-5 shrink-0">
          <Icon className={classNames("size-5", iconClassName)} />
          <div className="bg-fg-brand absolute -right-0.5 -top-0.5 size-1.5 rounded-full" />
        </div>
      ) : (
        <Icon className={classNames("size-5 shrink-0", iconClassName)} />
      )}
    </button>
  )
}
