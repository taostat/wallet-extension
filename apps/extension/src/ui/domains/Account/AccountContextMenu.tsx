import { Copy01 } from "@untitledui/icons/Copy01"
import { DotsHorizontal } from "@untitledui/icons/DotsHorizontal"
import { Download01 } from "@untitledui/icons/Download01"
import { Edit01 } from "@untitledui/icons/Edit01"
import { Eye } from "@untitledui/icons/Eye"
import { LinkExternal01 } from "@untitledui/icons/LinkExternal01"
import { Send01 } from "@untitledui/icons/Send01"
import { Settings01 } from "@untitledui/icons/Settings01"
import { XClose } from "@untitledui/icons/XClose"
import { Account, getAccountGenesisHash } from "extension-core"
import React, { FC, forwardRef, Suspense, useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import {
  ContextMenu,
  ContextMenuActionItem,
  ContextMenuContent,
  ContextMenuTrigger,
  PopoverOptions,
} from "taostats-ui"

import { SuspenseTracker } from "@taostats/components/SuspenseTracker"
import { useAccountExportModal } from "@ui/domains/Account/AccountExportModal"
import { useAccountRemoveModal } from "@ui/domains/Account/AccountRemoveModal"
import { useAccountRenameModal } from "@ui/domains/Account/AccountRenameModal"
import { useCopyAddressModal } from "@ui/domains/CopyAddress"
import { useViewOnExplorer } from "@ui/domains/ViewOnExplorer"
import { useAccountToggleIsPortfolio } from "@ui/hooks/useAccountToggleIsPortfolio"
import { useAnalytics } from "@ui/hooks/useAnalytics"
import { useSendFundsPopup } from "@ui/hooks/useSendFundsPopup"
import { useAccountByAddress, useNetworkByGenesisHash } from "@ui/state"

import { usePortfolioNavigation } from "../Portfolio/usePortfolioNavigation"

const ViewOnExplorerMenuItem: FC<{ account: Account }> = ({ account }) => {
  const { t } = useTranslation()
  const { open, canOpen } = useViewOnExplorer(account.address, getAccountGenesisHash(account))
  const { genericEvent } = useAnalytics()

  const handleClick = useCallback(() => {
    open()
    genericEvent("open view on explorer", { from: "account menu" })
  }, [genericEvent, open])

  if (!canOpen) return null

  return (
    <ContextMenuActionItem
      label={t("View on Taostats")}
      icon={LinkExternal01}
      onClick={handleClick}
    />
  )
}

type Props = {
  analyticsFrom: string
  address?: string
  placement?: PopoverOptions["placement"]
  trigger?: React.ReactNode
  hideManageAccounts?: boolean
  disabled?: boolean
}

/**
 * If the `address` prop is a string, this component will operate on the account with the given address.
 * If the `address` prop is undefined, this component will operate on the `selectedAccount` from `useSelectedAccount`.
 * If the `address` prop is null, this component will ignore `selectedAccount`
 */
export const AccountContextMenu = forwardRef<HTMLElement, Props>(function AccountContextMenu(
  { analyticsFrom, address, placement, trigger, hideManageAccounts, disabled },
  ref,
) {
  const { t } = useTranslation()
  const propsAccount = useAccountByAddress(address)

  const { selectedAccount } = usePortfolioNavigation()
  const account =
    (address === null
      ? // if address prop is null, set account to null
        null
      : address === undefined
        ? // if address prop is undefined, set account to selectedAccount
          selectedAccount
        : // if address prop is a string, set account to propsAccount
          propsAccount) ??
    // make sure account is either an `Account` or undefined
    undefined

  const navigate = useNavigate()
  const { genericEvent } = useAnalytics()

  const { canToggleIsPortfolio, toggleIsPortfolio, toggleLabel } =
    useAccountToggleIsPortfolio(account)

  const chain = useNetworkByGenesisHash(getAccountGenesisHash(account))

  // TODO: These modal providers used to be used in multiple places,
  // hence the hectic API we've got going on here.
  // We should clean them up to just support this one component's use-case.
  const { open: openCopyAddressModal } = useCopyAddressModal()
  const canCopyAddress = !!account
  const copyAddress = useCallback(() => {
    if (!account) return
    genericEvent("open copy address", { from: analyticsFrom })
    openCopyAddressModal({ address: account.address, networkId: chain?.id })
  }, [account, analyticsFrom, chain?.id, genericEvent, openCopyAddressModal])

  const { canSendFunds, openSendFundsPopup } = useSendFundsPopup(account)
  const sendFunds = useCallback(() => {
    genericEvent("open send funds", { from: analyticsFrom })
    openSendFundsPopup()
  }, [analyticsFrom, genericEvent, openSendFundsPopup])

  const { open: _openAccountRenameModal } = useAccountRenameModal()
  const canRename = !!account
  const openAccountRenameModal = useCallback(
    () => _openAccountRenameModal(account),
    [_openAccountRenameModal, account],
  )

  const { canExportAccountFunc, open: _openAccountExportModal } = useAccountExportModal()
  const canExport = useMemo(() => canExportAccountFunc(account), [account, canExportAccountFunc])
  const openAccountExportModal = useCallback(
    () => _openAccountExportModal(account),
    [_openAccountExportModal, account],
  )

  const { open: _openAccountRemoveModal } = useAccountRemoveModal()
  const openAccountRemoveModal = useCallback(
    () => _openAccountRemoveModal(account),
    [_openAccountRemoveModal, account],
  )

  const goToManageAccounts = useCallback(() => navigate("/settings/accounts"), [navigate])

  return (
    <ContextMenu placement={placement ?? "bottom-end"}>
      <ContextMenuTrigger
        ref={ref}
        className="enabled:hover:bg-secondary text-fg-secondary enabled:hover:text-fg-primary disabled:text-fg-disabled rounded p-3 disabled:cursor-[inherit]"
        asChild={!!trigger}
        disabled={disabled}
      >
        {trigger ? trigger : <DotsHorizontal className="shrink-0" />}
      </ContextMenuTrigger>
      <ContextMenuContent>
        <Suspense fallback={<SuspenseTracker name="AccountContextMenu" />}>
          {account && (
            <>
              {canToggleIsPortfolio && (
                <ContextMenuActionItem label={toggleLabel} icon={Eye} onClick={toggleIsPortfolio} />
              )}
              {canCopyAddress && (
                <ContextMenuActionItem
                  label={t("Copy address")}
                  icon={Copy01}
                  onClick={copyAddress}
                />
              )}
              {canSendFunds && (
                <ContextMenuActionItem label={t("Send funds")} icon={Send01} onClick={sendFunds} />
              )}
              <ViewOnExplorerMenuItem account={account} />
              {canRename && (
                <ContextMenuActionItem
                  label={t("Rename")}
                  icon={Edit01}
                  onClick={openAccountRenameModal}
                />
              )}
              {canExport && (
                <ContextMenuActionItem
                  label={t("Export as JSON")}
                  icon={Download01}
                  onClick={openAccountExportModal}
                />
              )}
              <ContextMenuActionItem
                label={t("Remove account")}
                icon={XClose}
                destructive
                onClick={openAccountRemoveModal}
              />
            </>
          )}
          {!hideManageAccounts && (
            <ContextMenuActionItem
              label={t("Manage accounts")}
              icon={Settings01}
              onClick={goToManageAccounts}
            />
          )}
        </Suspense>
      </ContextMenuContent>
    </ContextMenu>
  )
})
