import { classNames } from "@taostats-wallet/util"
import { AlertCircle } from "@untitledui/icons/AlertCircle"
import { BookClosed } from "@untitledui/icons/BookClosed"
import { ChevronRight } from "@untitledui/icons/ChevronRight"
import { Globe01 } from "@untitledui/icons/Globe01"
import { Key01 } from "@untitledui/icons/Key01"
import { Lock01 } from "@untitledui/icons/Lock01"
import { Plus } from "@untitledui/icons/Plus"
import { QrCode01 } from "@untitledui/icons/QrCode01"
import { Settings01 } from "@untitledui/icons/Settings01"
import { FC, ReactNode, SVGProps, useCallback } from "react"
import { useTranslation } from "react-i18next"

import { api } from "@ui/api"
import { AnalyticsPage, sendAnalyticsEvent } from "@ui/api/analytics"
import { useMnemonicsAllBackedUp } from "@ui/hooks/useMnemonicsAllBackedUp"
import { closeWalletSurface } from "@ui/util/closeWalletSurface"

const ANALYTICS_PAGE: AnalyticsPage = {
  container: "Popup",
  feature: "Navigation",
  featureVersion: 3,
  page: "Settings",
}

type SettingsNavItemProps = {
  icon: FC<SVGProps<SVGSVGElement>>
  children: ReactNode
  onClick: () => void
  variant?: "default" | "danger"
}

const SettingsNavItem: FC<SettingsNavItemProps> = ({
  icon: Icon,
  children,
  onClick,
  variant = "default",
}) => {
  const isDanger = variant === "danger"

  return (
    <button
      type="button"
      onClick={onClick}
      className={classNames(
        "border-primary flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left",
        "transition-colors duration-700 ease-out",
        isDanger
          ? "bg-accent-2/10 hover:bg-accent-2/[0.18] active:bg-accent-2/20"
          : "bg-secondary-solid hover:bg-white/[0.06] active:bg-white/[0.08]",
      )}
    >
      <div
        className={classNames(
          "flex size-9 shrink-0 items-center justify-center rounded-lg border",
          isDanger
            ? "border-accent-2/30 bg-black/40 text-accent-2"
            : "border-fg-brand/30 bg-black/40 text-fg-brand",
        )}
      >
        <Icon className="size-[18px]" />
      </div>
      <span
        className={classNames(
          "flex-1 text-sm font-medium",
          isDanger ? "text-accent-2" : "text-fg-primary",
        )}
      >
        {children}
      </span>
      <ChevronRight
        className={classNames("size-4 shrink-0", isDanger ? "text-accent-2" : "text-fg-tertiary")}
      />
    </button>
  )
}

export const SettingsMenu: FC = () => {
  const { t } = useTranslation()

  const handleLock = useCallback(async () => {
    sendAnalyticsEvent({
      ...ANALYTICS_PAGE,
      name: "Interact",
      action: "Lock wallet",
    })
    api.lock()
    void closeWalletSurface()
  }, [])

  const handleAddAccountClick = useCallback(() => {
    sendAnalyticsEvent({
      ...ANALYTICS_PAGE,
      name: "Goto",
      action: "Add account button",
    })
    api.dashboardOpen("/accounts/add")
    void closeWalletSurface()
  }, [])

  const handleAddressBookClick = useCallback(() => {
    sendAnalyticsEvent({
      ...ANALYTICS_PAGE,
      name: "Goto",
      action: "Address Book button",
    })
    api.dashboardOpen("/settings/address-book")
    void closeWalletSurface()
  }, [])

  const allBackedUp = useMnemonicsAllBackedUp()
  const handleBackupClick = useCallback(() => {
    sendAnalyticsEvent({
      ...ANALYTICS_PAGE,
      name: "Goto",
      action: "Backup Wallet button",
    })
    api.dashboardOpen("/settings/mnemonics")
    void closeWalletSurface()
  }, [])

  const handleTaostatsAppImportClick = useCallback(() => {
    sendAnalyticsEvent({
      ...ANALYTICS_PAGE,
      name: "Goto",
      action: "Taostats App Import button",
    })
    api.dashboardOpen("/settings/taostats-app-import")
    void closeWalletSurface()
  }, [])

  const handleSettingsClick = useCallback(() => {
    sendAnalyticsEvent({
      ...ANALYTICS_PAGE,
      name: "Goto",
      action: "Settings button",
    })
    api.dashboardOpen("/settings/general")
    void closeWalletSurface()
  }, [])

  const handleManageNetworksClick = useCallback(() => {
    sendAnalyticsEvent({
      ...ANALYTICS_PAGE,
      name: "Goto",
      action: "Manage Networks button",
    })
    api.dashboardOpen("/settings/networks-tokens/networks")
    void closeWalletSurface()
  }, [])

  return (
    <div className="flex flex-col gap-2 p-4">
      <SettingsNavItem icon={Plus} onClick={handleAddAccountClick}>
        {t("Add Account")}
      </SettingsNavItem>
      <SettingsNavItem icon={BookClosed} onClick={handleAddressBookClick}>
        {t("Address Book")}
      </SettingsNavItem>
      <SettingsNavItem icon={Globe01} onClick={handleManageNetworksClick}>
        {t("Manage Networks")}
      </SettingsNavItem>
      <SettingsNavItem icon={Key01} onClick={handleBackupClick}>
        <span className="flex items-center">
          {t("Backup Wallet")}
          {!allBackedUp && <AlertCircle className="text-fg-brand ml-1 inline size-4" />}
        </span>
      </SettingsNavItem>
      <SettingsNavItem icon={QrCode01} onClick={handleTaostatsAppImportClick}>
        {t("Generate QR code for Taostats App Import")}
      </SettingsNavItem>
      <SettingsNavItem icon={Settings01} onClick={handleSettingsClick}>
        {t("All Settings")}
      </SettingsNavItem>
      <div className="bg-secondary my-2 h-px w-full" />
      <SettingsNavItem icon={Lock01} onClick={handleLock} variant="danger">
        {t("Lock Wallet")}
      </SettingsNavItem>
    </div>
  )
}
