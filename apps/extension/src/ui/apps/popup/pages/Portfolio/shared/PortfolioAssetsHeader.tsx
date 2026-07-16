import { Balance, Balances } from "@taostats-wallet/balances"
import { classNames } from "@taostats-wallet/util"
import { ChevronLeft } from "@untitledui/icons/ChevronLeft"
import { Copy01 } from "@untitledui/icons/Copy01"
import { DotsHorizontal } from "@untitledui/icons/DotsHorizontal"
import { Send01 } from "@untitledui/icons/Send01"
import { Account, getAccountGenesisHash, getAccountSignetUrl } from "extension-core"
import { FC, Suspense, useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useLocation, useNavigate } from "react-router-dom"
import {
  ContextMenuTrigger,
  IconButton,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "taostats-ui"

import { SuspenseTracker } from "@taostats/components/SuspenseTracker"
import { AccountContextMenu } from "@ui/domains/Account/AccountContextMenu"
import { AccountTypeIcon } from "@ui/domains/Account/AccountTypeIcon"
import { Address } from "@ui/domains/Account/Address"
import { CurrentAccountAvatar } from "@ui/domains/Account/CurrentAccountAvatar"
import { Fiat } from "@ui/domains/Asset/Fiat"
import { useCopyAddressModal } from "@ui/domains/CopyAddress"
import { usePortfolioNavigation } from "@ui/domains/Portfolio/usePortfolioNavigation"
import { useAnalytics } from "@ui/hooks/useAnalytics"
import { useFormattedAddress } from "@ui/hooks/useFormattedAddress"
import { useSendFundsPopup } from "@ui/hooks/useSendFundsPopup"
import {
  useBalances,
  useNetworkByGenesisHash,
  usePortfolioBalances,
  useSelectedCurrency,
} from "@ui/state"

const SendFundsButton: FC<{ account?: Account | null }> = ({ account }) => {
  const { t } = useTranslation()
  const { canSendFunds, cannotSendFundsReason, openSendFundsPopup } = useSendFundsPopup(account)

  const { genericEvent } = useAnalytics()

  const sendFunds = useCallback(() => {
    openSendFundsPopup()
    genericEvent("open send funds", { from: "popup portfolio" })
  }, [openSendFundsPopup, genericEvent])

  return (
    <Tooltip placement="bottom">
      <TooltipTrigger
        onClick={canSendFunds ? sendFunds : undefined}
        className={classNames(
          "text-fg-secondary text-md flex h-8 w-8 flex-col items-center justify-center rounded-full",
          canSendFunds ? "hover:bg-secondary hover:text-fg-primary" : "cursor-default opacity-50",
        )}
      >
        <Send01 />
      </TooltipTrigger>
      <TooltipContent>{canSendFunds ? t("Send") : cannotSendFundsReason}</TooltipContent>
    </Tooltip>
  )
}

const CopyAddressButton: FC<{ account?: Account | null }> = ({ account }) => {
  const { t } = useTranslation()
  const { open: openCopyAddressModal } = useCopyAddressModal()
  const { selectedFolder } = usePortfolioNavigation()

  const { genericEvent } = useAnalytics()

  const chain = useNetworkByGenesisHash(getAccountGenesisHash(account))
  const copyAddress = useCallback(() => {
    openCopyAddressModal({
      address: account?.address,
      networkId: chain?.id,
      addresses: selectedFolder?.tree.map((account) => account.address),
    })
    genericEvent("open copy address", { from: "popup portfolio" })
  }, [account?.address, chain?.id, genericEvent, openCopyAddressModal, selectedFolder?.tree])

  return (
    <Tooltip placement="bottom">
      <TooltipTrigger
        onClick={copyAddress}
        className="hover:bg-secondary text-fg-secondary hover:text-fg-primary text-md flex h-8 w-8 flex-col items-center justify-center rounded-full"
      >
        <Copy01 />
      </TooltipTrigger>
      <TooltipContent>{t("Copy address")}</TooltipContent>
    </Tooltip>
  )
}

export const PortfolioAssetsHeader: FC<{ backBtnTo?: string }> = ({ backBtnTo }) => {
  const { t } = useTranslation()
  const currency = useSelectedCurrency()

  const allBalances = useBalances()
  const { networkBalances } = usePortfolioBalances()
  const { selectedAccount: account, selectedFolder: folder } = usePortfolioNavigation()

  const balancesByAddress = useMemo(() => {
    // we use this to avoid looping over the balances list n times, where n is the number of accounts in the wallet
    // instead, we'll only interate over the balances one time
    const balancesByAddress: Map<string, Balance[]> = new Map()
    allBalances.each.forEach((balance) => {
      if (!balancesByAddress.has(balance.address)) balancesByAddress.set(balance.address, [])
      balancesByAddress.get(balance.address)?.push(balance)
    })
    return balancesByAddress
  }, [allBalances])

  const balances = useMemo(
    () =>
      account
        ? new Balances(balancesByAddress.get(account.address) ?? [])
        : folder
          ? new Balances(
              folder.tree.flatMap((account) => balancesByAddress.get(account.address) ?? []),
            )
          : // only show networkBalances when no account / folder selected
            // networkBalances is basically the full portfolio, without any watch-only accounts
            // i.e. `Total Portfolio`
            // on the other hand, allBalances includes watch-only accounts
            networkBalances,
    [account, balancesByAddress, folder, networkBalances],
  )

  const formattedAddress = useFormattedAddress(account?.address, getAccountGenesisHash(account))

  const location = useLocation()
  const navigate = useNavigate()
  const handleBackBtnClick = useCallback(() => {
    if (backBtnTo) navigate(backBtnTo + location.search)
    else navigate(-1)
  }, [backBtnTo, location.search, navigate])

  return (
    // top margin hack is to prevent account genesis hash icon from being truncated
    <div className="-mt-2">
      <div className="mt-2 flex h-[44px] w-full items-center gap-4">
        <div className="flex h-full grow items-center gap-2 overflow-hidden">
          <IconButton onClick={handleBackBtnClick}>
            <ChevronLeft />
          </IconButton>
          <div className="flex flex-col justify-center">
            <CurrentAccountAvatar className="!text-[36px]" />
          </div>
          <div className="flex grow flex-col gap-0.5 overflow-hidden pl-1 text-sm">
            <div className="flex items-center gap-1.5">
              <div className={classNames("truncate", account ? "" : "text-fg-secondary")}>
                {account
                  ? (account.name ?? t("Unnamed Account"))
                  : folder
                    ? folder.name
                    : t("Total Portfolio")}
              </div>
              <AccountTypeIcon
                className="text-fg-brand"
                type={account?.type}
                signetUrl={getAccountSignetUrl(account)}
              />
            </div>
            <div className={classNames("truncate", account ? "text-fg-secondary" : "")}>
              {account ? (
                <Address address={formattedAddress} />
              ) : (
                <Fiat amount={balances.sum.fiat(currency).total} isBalance />
              )}
            </div>
          </div>
        </div>
        <div className="flex h-full items-center justify-end">
          <Suspense fallback={<SuspenseTracker name="PortfolioAssetHeader.Buttons" />}>
            <CopyAddressButton account={account} />
            <SendFundsButton account={account} />
            {account && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <AccountContextMenu
                    analyticsFrom="popup portfolio"
                    address={account?.address}
                    hideManageAccounts
                    trigger={
                      <ContextMenuTrigger className="hover:bg-secondary text-fg-secondary hover:text-fg-primary text-md flex h-8 w-8 flex-col items-center justify-center rounded-full">
                        <DotsHorizontal />
                      </ContextMenuTrigger>
                    }
                  />
                </TooltipTrigger>
                <TooltipContent>{t("More options")}</TooltipContent>
              </Tooltip>
            )}
          </Suspense>
        </div>
      </div>
    </div>
  )
}
