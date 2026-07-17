import { classNames } from "@taostats-wallet/util"
import { AlertCircle } from "@untitledui/icons/AlertCircle"
import { BookOpen02 } from "@untitledui/icons/BookOpen02"
import { Globe01 } from "@untitledui/icons/Globe01"
import { InfoCircle } from "@untitledui/icons/InfoCircle"
import { Link01 } from "@untitledui/icons/Link01"
import { Passcode } from "@untitledui/icons/Passcode"
import { Shield03 } from "@untitledui/icons/Shield03"
import { Sliders01 } from "@untitledui/icons/Sliders01"
import { Wallet01 } from "@untitledui/icons/Wallet01"
import { FC, ReactNode, Suspense } from "react"
import { useTranslation } from "react-i18next"
import { NavLink, To, useMatch } from "react-router-dom"
import { SurfaceCard } from "taostats-ui"

import { SuspenseTracker } from "@taostats/components/SuspenseTracker"
import { useMnemonicsAllBackedUp } from "@ui/hooks/useMnemonicsAllBackedUp"

export const DashboardSettingsSidebar = () => {
  const { t } = useTranslation()

  return (
    <SurfaceCard className="flex w-full flex-col gap-5 p-4">
      <div className="text-fg-primary px-2 text-lg font-bold">{t("Settings")}</div>
      <div className="gap-md flex w-full flex-col">
        <SidebarNavItem to="/settings/general" label={t("General")} icon={<Sliders01 />} />
        <SidebarNavItem
          label={t("Manage Accounts")}
          to="/settings/accounts"
          icon={<Wallet01 />}
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
          icon={<Passcode />}
        />
        <SidebarNavItem
          to="/settings/address-book"
          label={t("Address Book")}
          icon={<BookOpen02 />}
        />
        <SidebarNavItem
          label={t("Connected Sites")}
          to="/settings/connected-sites"
          icon={<Link01 />}
        />
        <SidebarNavItem
          label={t("Security & Privacy")}
          to="/settings/security-privacy-settings"
          icon={<Shield03 />}
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
  const forceActive = !!useMatch(matchPath ?? "UNEXISTANT_PATH")

  return (
    <NavLink
      to={to}
      className={({ isActive }) => {
        const selected = isActive || forceActive
        return classNames(
          "relative flex w-full items-center gap-3 overflow-hidden rounded-md border px-3 py-2",
          "transition-[color,background-color,border-color,opacity] duration-700 ease-out",
          selected
            ? "border-primary text-fg-primary bg-white/[0.04]"
            : "text-fg-tertiary hover:text-fg-secondary border-transparent bg-transparent",
          className,
        )
      }}
    >
      {({ isActive }) => {
        const selected = isActive || forceActive
        return (
          <>
            <span
              className={classNames(
                "bg-fg-brand absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full shadow-[0_0_8px_2px_rgb(0_219_188_/_0.7)]",
                "transition-opacity duration-700 ease-out",
                selected ? "opacity-100" : "opacity-0",
              )}
              aria-hidden
            />
            <span className="size-5 shrink-0 [&_svg]:size-5">{icon}</span>
            <span className="truncate text-sm font-medium">{label}</span>
          </>
        )
      }}
    </NavLink>
  )
}

const MnemonicNotification = () => {
  const allBackedUp = useMnemonicsAllBackedUp()

  return !allBackedUp ? <AlertCircle className="text-fg-orange size-4" /> : null
}
