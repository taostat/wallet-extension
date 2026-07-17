import { PencilIcon, SecretIcon } from "@taostats-wallet/icons"
import { classNames } from "@taostats-wallet/util"
import { AlertCircle } from "@untitledui/icons/AlertCircle"
import { Globe01 } from "@untitledui/icons/Globe01"
import { InfoCircle } from "@untitledui/icons/InfoCircle"
import { Link01 } from "@untitledui/icons/Link01"
import { Plus } from "@untitledui/icons/Plus"
import { Shield01 } from "@untitledui/icons/Shield01"
import { Sliders01 } from "@untitledui/icons/Sliders01"
import { Users01 } from "@untitledui/icons/Users01"
import { FC, ReactNode, Suspense, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { NavLink, To, useMatch, useNavigate } from "react-router-dom"
import { IconButton, SurfaceCard, Tooltip, TooltipContent, TooltipTrigger } from "taostats-ui"

import { SuspenseTracker } from "@taostats/components/SuspenseTracker"
import { useAnalytics } from "@ui/hooks/useAnalytics"
import { useMnemonicsAllBackedUp } from "@ui/hooks/useMnemonicsAllBackedUp"

export const DashboardSettingsSidebar = () => {
  const { t } = useTranslation()
  const { genericEvent } = useAnalytics()
  const navigate = useNavigate()

  const handleAddAccountClick = useCallback(() => {
    genericEvent("goto add account", { from: "sidebar" })
    navigate("/accounts/add")
  }, [genericEvent, navigate])

  return (
    <SurfaceCard className="flex w-full flex-col gap-4 p-4">
      <div className="flex h-8 shrink-0 items-center">
        <div className="text-fg-primary grow pl-2 text-lg font-bold">{t("Settings")}</div>
        <Tooltip>
          <TooltipTrigger asChild>
            <IconButton
              onClick={handleAddAccountClick}
              className="bg-fg-brand/10 enabled:hover:bg-fg-brand/20 enabled:hover:text-fg-brand text-fg-brand/90 rounded-full p-1.5"
            >
              <Plus className="size-5" />
            </IconButton>
          </TooltipTrigger>
          <TooltipContent>{t("Add Account")}</TooltipContent>
        </Tooltip>
      </div>
      <div className="bg-secondary h-px" />
      <div className="flex w-full flex-col gap-2">
        <SidebarNavItem to="/settings/general" label={t("General")} icon={<Sliders01 />} />
        <SidebarNavItem
          label={t("Manage Accounts")}
          to="/settings/accounts"
          icon={<PencilIcon />}
          matchPath="/accounts/*"
        />
        <SidebarNavItem
          label={
            <span className="flex items-center gap-1">
              {t("Recovery Phrases")}
              <Suspense fallback={<SuspenseTracker name="SettingsSidebar.MnemonicNotification" />}>
                <MnemonicNotification />
              </Suspense>
            </span>
          }
          to="/settings/mnemonics"
          icon={<SecretIcon />}
        />
        <SidebarNavItem to="/settings/address-book" label={t("Address Book")} icon={<Users01 />} />
        <SidebarNavItem
          label={t("Connected Sites")}
          to="/settings/connected-sites"
          icon={<Link01 />}
        />
        <SidebarNavItem
          label={t("Security & Privacy")}
          to="/settings/security-privacy-settings"
          icon={<Shield01 />}
        />
        <SidebarNavItem
          label={t("Networks & Tokens")}
          to="/settings/networks-tokens"
          icon={<Globe01 />}
        />
        <SidebarNavItem label={t("About")} to="/settings/about" icon={<InfoCircle />} />
      </div>
    </SurfaceCard>
  )
}

const SidebarNavItem: FC<{
  to: To
  icon: ReactNode
  label: ReactNode
  matchPath?: string
  className?: string
}> = ({ to, icon, label, matchPath, className }) => {
  const forceActive = useMatch(matchPath ?? "UNEXISTANT_PATH")

  return (
    <NavLink
      to={to}
      className={classNames(
        "flex h-14 w-full items-center gap-3 overflow-hidden rounded-lg border px-3 transition-colors",
        "text-fg-tertiary [&.active]:text-fg-primary",
        "border-primary/6 hover:bg-tertiary/50 bg-transparent",
        "[&.active]:border-fg-brand [&.active]:bg-fg-brand/5",
        forceActive && "active",
        className,
      )}
    >
      <span className="size-5 shrink-0 text-lg">{icon}</span>
      <span className="truncate text-sm font-medium">{label}</span>
    </NavLink>
  )
}

const MnemonicNotification = () => {
  const allBackedUp = useMnemonicsAllBackedUp()

  return !allBackedUp ? <AlertCircle className="text-fg-orange" /> : null
}
