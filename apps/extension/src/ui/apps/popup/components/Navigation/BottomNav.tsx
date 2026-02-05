import {
  CloseIcon,
  ExpandIcon,
  HistoryIcon,
  HomeIcon,
  Link2Icon,
  MenuIcon,
} from "@taostats-wallet/icons"
import { classNames } from "@taostats-wallet/util"
import { TAOSTATS_WEB_APP_STAKING_URL } from "extension-shared"
import { FC, ReactNode, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { useLocation, useMatch, useNavigate } from "react-router-dom"

import { api } from "@ui/api"
import { AnalyticsPage, sendAnalyticsEvent } from "@ui/api/analytics"
import { useMnemonicsAllBackedUp } from "@ui/hooks/useMnemonicsAllBackedUp"
import { usePopupNavOpenClose } from "@ui/hooks/usePopupNavOpenClose"

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
  const { open } = usePopupNavOpenClose()
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
    window.close()
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
    window.close()
  }, [location.pathname, location.search])

  const handleMoreClick = useCallback(() => {
    sendAnalyticsEvent({
      ...ANALYTICS_PAGE,
      name: "Interact",
      action: "More button",
    })
    open()
  }, [open])

  const allBackedUp = useMnemonicsAllBackedUp()

  const { t } = useTranslation()

  return (
    <>
      <div className="h-32 shrink-0">{/* Placeholder for nav height */}</div>
      <QuickSettingsOverlay />

      <div className="absolute bottom-0 left-0 z-20 flex w-full flex-col justify-center gap-6 px-8 pb-6">
        <QuickSettingsModal />
        <div
          className={classNames(
            "border-grey-800 flex h-[5.2rem] w-full items-center justify-between rounded border bg-black/90 px-7 backdrop-blur-[2px]",
          )}
        >
          <NavButton
            label={t("Home")}
            icon={HomeIcon}
            onClick={handleHomeClick}
            route="/portfolio/*"
          />
          <NavButton
            label={t("Staking")}
            icon={Link2Icon}
            iconClassName="-rotate-45"
            onClick={handleStakingClick}
          />
          <NavButton
            label={t("History")}
            icon={HistoryIcon}
            onClick={handleTxHistoryClick}
            route="/tx-history"
          />
          <NavButton label={t("Full Screen")} icon={ExpandIcon} onClick={handleExpandClick} />
          {isQuickSettingsOpen ? (
            <NavButton
              label={t("Close")}
              icon={CloseIcon}
              onClick={closeQuickSettings}
              className="!text-white"
            />
          ) : (
            <NavButton
              label={t("More")}
              icon={MenuIcon}
              onClick={handleMoreClick}
              withBadge={!allBackedUp}
            />
          )}
        </div>
      </div>
    </>
  )
}

const NavButton: FC<{
  label: ReactNode
  icon: FC<{ className?: string }>
  iconClassName?: string
  className?: string
  withBadge?: boolean
  route?: string
  onClick: () => void
}> = ({ label, icon: Icon, iconClassName, withBadge, route, className, onClick }) => {
  const routeMatch = useMatch(route ?? "")

  return (
    <button
      type="button"
      className={classNames(
        "group",
        "text-body-disabled h-20 w-20",
        "enabled:hover:text-body-secondary",
        "enabled:focus-visible:border",
        routeMatch && "!text-primary",
        className,
      )}
      onClick={onClick}
    >
      <div
        className={classNames(
          "flex w-full flex-col items-center justify-center gap-[0.15rem] overflow-visible",
          "translate-y-4 transition-transform group-hover:translate-y-0",
        )}
      >
        {withBadge ? (
          <div className="relative size-10 shrink-0">
            <Icon className={classNames("size-10", iconClassName)} />
            <div className="bg-primary absolute -right-1 -top-1 size-3 rounded-full"></div>
          </div>
        ) : (
          <Icon className={classNames("size-10 shrink-0", iconClassName)} />
        )}
        <div
          className={classNames(
            "leading-paragraph text-[1rem]",
            "text-nowrap opacity-0 transition-opacity group-hover:opacity-100",
          )}
        >
          {label}
        </div>
      </div>
    </button>
  )
}
