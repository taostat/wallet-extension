import { AlertCircle } from "@untitledui/icons/AlertCircle"
import { Globe01 } from "@untitledui/icons/Globe01"
import { Key01 } from "@untitledui/icons/Key01"
import { Lock01 } from "@untitledui/icons/Lock01"
import { Plus } from "@untitledui/icons/Plus"
import { Settings01 } from "@untitledui/icons/Settings01"
import { Users01 } from "@untitledui/icons/Users01"
import { X } from "@untitledui/icons/X"
import { FC, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { Drawer, IconButton } from "taostats-ui"

import { Nav, NavItem } from "@taostats/components/Nav"
import { TaostatsLogo } from "@taostats/theme/logos"
import { api } from "@ui/api"
import { AnalyticsPage, sendAnalyticsEvent } from "@ui/api/analytics"
import { BuildVersionPill } from "@ui/domains/Build/BuildVersionPill"
import { useMnemonicsAllBackedUp } from "@ui/hooks/useMnemonicsAllBackedUp"
import { usePopupNavOpenClose } from "@ui/hooks/usePopupNavOpenClose"
import { closeWalletSurface } from "@ui/util/closeWalletSurface"

const ANALYTICS_PAGE: AnalyticsPage = {
  container: "Popup",
  feature: "Navigation",
  featureVersion: 3,
  page: "Portfolio",
}

export const NavigationDrawer: FC = () => {
  const { t } = useTranslation()
  const { isOpen, close } = usePopupNavOpenClose()

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
    <Drawer className="h-full" containerId="main" anchor="bottom" isOpen={isOpen} onDismiss={close}>
      <div className="flex h-full w-full flex-col bg-black">
        <header className="border-primary box-border flex h-[72px] w-full items-center justify-between gap-3 border-b px-6">
          <TaostatsLogo className="h-[25px] w-auto" />
          <BuildVersionPill className="bg-fg-brand/20 text-fg-brand hover:bg-fg-brand/30" />
          <div className="grow"></div>
          <IconButton onClick={close} aria-label={t("Close menu")}>
            <X />
          </IconButton>
        </header>
        <div className="w-full grow overflow-hidden">
          {/* buttons must shrink height if necessary */}
          <Nav className="flex size-full flex-col overflow-hidden p-2">
            <NavItem icon={<Plus />} onClick={handleAddAccountClick}>
              {t("Add Account")}
            </NavItem>
            <NavItem icon={<Users01 />} onClick={handleAddressBookClick}>
              {t("Address Book")}
            </NavItem>
            <NavItem icon={<Globe01 />} onClick={handleManageNetworksClick}>
              {t("Manage Networks")}
            </NavItem>

            <NavItem icon={<Key01 />} onClick={handleBackupClick}>
              <span className="flex items-center">
                {t("Backup Wallet")}
                {!allBackedUp && <AlertCircle className="text-fg-brand ml-1 inline text-sm" />}
              </span>
            </NavItem>
            <NavItem icon={<Settings01 />} onClick={handleSettingsClick}>
              {t("All Settings")}
            </NavItem>
          </Nav>
        </div>
        <footer>
          <button
            type="button"
            className="text-fg-secondary hover:bg-secondary hover:text-fg-primary flex w-full flex-col items-center"
            onClick={handleLock}
          >
            <div className="border-1 border-primary h-0 w-[22px]/12 border-t" />
            <div className="flex w-full items-center justify-center gap-2 p-5">
              <Lock01 className="text-md" />
              <span>{t("Lock Wallet")}</span>
            </div>
          </button>
        </footer>
      </div>
    </Drawer>
  )
}
