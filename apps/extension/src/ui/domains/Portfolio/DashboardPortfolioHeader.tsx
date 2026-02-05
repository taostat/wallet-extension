import { ArrowDownIcon, FolderIcon, MoreHorizontalIcon, SendIcon } from "@taostats-wallet/icons"
import { classNames, isNotNil } from "@taostats-wallet/util"
import { Account, getAccountGenesisHash, isAccountOwned, TreeFolder } from "extension-core"
import { FC, MouseEventHandler, useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useMatch } from "react-router-dom"
import {
  ContextMenuTrigger,
  IconButton,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "taostats-ui"

import { shortenAddress } from "@taostats/util/shortenAddress"
import { api } from "@ui/api"
import { AnalyticsEventName, AnalyticsPage, sendAnalyticsEvent } from "@ui/api/analytics"
import { AccountContextMenu } from "@ui/domains/Account/AccountContextMenu"
import { AccountIcon } from "@ui/domains/Account/AccountIcon"
import { AccountTypeIcon } from "@ui/domains/Account/AccountTypeIcon"
import { AllAccountsIcon } from "@ui/domains/Account/AllAccountsIcon"
import { FolderContextMenu } from "@ui/domains/Account/FolderContextMenu"
import { currencyConfig } from "@ui/domains/Asset/currencyConfig"
import { Fiat } from "@ui/domains/Asset/Fiat"
import { useCopyAddressModal } from "@ui/domains/CopyAddress"
import { useToggleCurrency } from "@ui/hooks/useToggleCurrency"
import { useBalanceTotals, useSelectedCurrency } from "@ui/state"

import { usePortfolioNavigation } from "./usePortfolioNavigation"

const SelectionScope: FC<{ account: Account | null; folder?: TreeFolder | null }> = ({
  account,
  folder,
}) => {
  const { t } = useTranslation()

  if (account)
    return (
      <div className="flex h-14 w-full items-center gap-6 text-base">
        <div className="flex h-14 grow items-center gap-3 overflow-hidden">
          <AccountIcon
            className="shrink-0 text-[2rem]"
            address={account.address}
            genesisHash={getAccountGenesisHash(account)}
          />
          <div className="truncate">{account.name ?? shortenAddress(account.address)}</div>
          <AccountTypeIcon type={account.type} className="text-primary" />
        </div>
        <div className="shrink-0">
          <AccountContextMenu
            address={account.address}
            analyticsFrom="dashboard portfolio"
            placement="bottom-end"
            trigger={
              <IconButton className="bg-grey-800/50 hover:bg-grey-800/80 flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-sm">
                <MoreHorizontalIcon className="text-base" />
              </IconButton>
            }
          />
        </div>
      </div>
    )

  if (folder)
    return (
      <div className="flex h-14 w-full items-center gap-6 text-base">
        <div className="flex grow items-center gap-3 overflow-hidden text-base">
          <div className="bg-grey-800 rounded-xs flex size-10 shrink-0 items-center justify-center">
            <FolderIcon className="text-primary shrink-0 text-xs" />
          </div>
          <div className="truncate">{folder.name}</div>
        </div>
        <div className="shrink-0">
          <FolderContextMenu
            folderId={folder.id}
            placement="bottom-end"
            trigger={
              <ContextMenuTrigger className="bg-grey-800/50 hover:bg-grey-800/80 flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-sm">
                <MoreHorizontalIcon className="text-base" />
              </ContextMenuTrigger>
            }
          />
        </div>
      </div>
    )

  return (
    <div className="flex h-14 items-center gap-3 text-base">
      <AllAccountsIcon className="shrink-0 text-[2rem]" />
      <div>{t("Total Portfolio")}</div>
    </div>
  )
}

export const DashboardPortfolioHeader: FC<{ className?: string }> = ({ className }) => {
  const { selectedAccount, selectedAccounts, selectedFolder } = usePortfolioNavigation()
  const balanceTotals = useBalanceTotals()

  const currency = useSelectedCurrency()
  const toggleCurrency = useToggleCurrency()

  const selectedTotal = useMemo(() => {
    return selectedAccounts.reduce((total, acc) => total + (balanceTotals[acc.address] ?? 0), 0)
  }, [selectedAccounts, balanceTotals])

  return (
    <div
      className={classNames(
        "bg-grey-900 relative z-0 flex flex-col items-start justify-between gap-4 rounded-lg p-10",
        className,
      )}
    >
      <div className="z-[1] flex w-full flex-col gap-4 overflow-hidden">
        <SelectionScope folder={selectedFolder} account={selectedAccount} />
        <div className="flex w-full max-w-full items-center gap-6">
          <button
            className={classNames(
              "bg-grey-700/20 text-grey-200 hover:text-body hover:bg-body/10 pointer-events-auto flex size-[4.4rem] shrink-0 items-center justify-center rounded-full text-center text-lg leading-none shadow-[inset_0px_0px_1px_rgb(228_228_228_/_1)] transition-[box-shadow,color,background-color] duration-200 ease-out hover:shadow-[inset_0px_0px_2px_rgb(250_250_250_/_1)]",
              currencyConfig[currency]?.symbol?.length === 2 && "text-md",
              currencyConfig[currency]?.symbol?.length > 2 && "text-base",
            )}
            onClick={(event) => {
              event.stopPropagation()
              toggleCurrency()
            }}
          >
            {currencyConfig[currency]?.symbol}
          </button>
          <Fiat
            className={classNames(
              "overflow-hidden text-ellipsis whitespace-pre pr-10 text-[3rem] font-bold leading-[3.6rem]",
            )}
            amount={selectedTotal}
            isBalance
            currencyDisplay="code"
          />
        </div>
      </div>
      <TopActions />
    </div>
  )
}

type ActionProps = {
  analyticsName: AnalyticsEventName
  analyticsAction?: string
  label: string
  tooltip?: string
  icon: FC<{ className?: string }>
  onClick: () => void
  disabled: boolean
  disabledReason?: string
}

const Action: FC<ActionProps> = ({
  analyticsName,
  analyticsAction,
  label,
  tooltip,
  icon: Icon,
  onClick,
  disabled,
  disabledReason,
}) => {
  const handleClick: MouseEventHandler<HTMLButtonElement> = useCallback(
    (event) => {
      event.stopPropagation()
      sendAnalyticsEvent({
        ...ANALYTICS_PAGE,
        name: analyticsName,
        action: analyticsAction,
      })
      onClick()
    },
    [onClick, analyticsAction, analyticsName],
  )

  return (
    <Tooltip placement="bottom-start">
      <TooltipTrigger asChild>
        <button
          type="button"
          className={classNames(
            "text-body-secondary pointer-events-auto flex h-14 items-center gap-4 rounded-full bg-white/5 px-5 text-base opacity-90 backdrop-blur-sm disabled:opacity-70",
            "enabled:hover:text-body enabled:hover:bg-white/10",
          )}
          onClick={handleClick}
          disabled={disabled}
        >
          <div>
            <Icon className="size-8" />
          </div>
          <div>{label}</div>
        </button>
      </TooltipTrigger>
      {(!!disabledReason || !!tooltip) && (
        <TooltipContent>{disabledReason || tooltip}</TooltipContent>
      )}
    </Tooltip>
  )
}

const ANALYTICS_PAGE: AnalyticsPage = {
  container: "Popup",
  feature: "Portfolio",
  featureVersion: 2,
  page: "Portfolio Home",
}

const TopActions: FC = () => {
  const { selectedAccounts, selectedAccount } = usePortfolioNavigation()
  const { t } = useTranslation()
  const { open: openCopyAddressModal } = useCopyAddressModal()

  const [disableActions, disabledReason] = useMemo(() => {
    if (!!selectedAccount && !isAccountOwned(selectedAccount))
      return [true, t("Cannot send or receive funds on accounts that you don't own") as string]

    if (!selectedAccounts.some(isAccountOwned))
      return [true, t("Cannot send or receive funds on accounts that you don't own") as string]

    return [false, ""]
  }, [selectedAccount, t, selectedAccounts])

  const selectedAddress = useMemo(() => selectedAccount?.address, [selectedAccount?.address])

  // this component is not located in the asset details route, so we can't use useParams
  const match = useMatch("/portfolio/tokens/:symbol")
  const symbol = useMemo(() => match?.params.symbol, [match])

  const topActions = useMemo<ActionProps[]>(
    () =>
      [
        {
          analyticsName: "Goto" as const,
          analyticsAction: "Send Funds button",
          label: t("Send"),
          icon: SendIcon,
          onClick: () =>
            api.sendFundsOpen({
              from: selectedAddress,
              tokenSymbol: symbol || undefined,
            }),
          disabled: disableActions,
          disabledReason,
        },
        {
          analyticsName: "Goto" as const,
          analyticsAction: "open receive",
          label: !!selectedAccount && !isAccountOwned(selectedAccount) ? t("Copy") : t("Receive"),
          icon: ArrowDownIcon,
          onClick: () =>
            openCopyAddressModal({
              address: selectedAddress,
            }),
          disabled: !selectedAccounts.length, // always allow, as long as there is at least one account
        },
      ].filter(isNotNil),
    [
      t,
      disableActions,
      disabledReason,
      selectedAccount,
      selectedAccounts.length,
      selectedAddress,
      symbol,
      openCopyAddressModal,
    ],
  )

  return (
    <div className="z-[1] flex w-full items-center justify-between gap-8">
      <div className="flex justify-center gap-4">
        {topActions.map((action, index) => (
          <Action key={index} {...action} />
        ))}
      </div>
    </div>
  )
}
