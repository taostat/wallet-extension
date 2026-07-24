import { PopoutIcon } from "@taostats-wallet/icons"
import { classNames, isNotNil } from "@taostats-wallet/util"
import { ArrowDownLeft } from "@untitledui/icons/ArrowDownLeft"
import { ArrowUpRight } from "@untitledui/icons/ArrowUpRight"
import { ChevronLeft } from "@untitledui/icons/ChevronLeft"
import { Copy01 } from "@untitledui/icons/Copy01"
import { DotsHorizontal } from "@untitledui/icons/DotsHorizontal"
import { Eye } from "@untitledui/icons/Eye"
import { EyeOff } from "@untitledui/icons/EyeOff"
import { Folder } from "@untitledui/icons/Folder"
import { SwitchVertical01 } from "@untitledui/icons/SwitchVertical01"
import { Account, getAccountGenesisHash, isAccountOwned, TreeFolder } from "extension-core"
import { TAOSTATS_WEB_APP_SWAP_URL } from "extension-shared"
import { FC, MouseEventHandler, useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useMatch, useNavigate } from "react-router-dom"
import {
  Button,
  ContextMenuTrigger,
  IconButton,
  PercentChangePill,
  SurfaceCard,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "taostats-ui"

import { fiatDecimalSeparator, formatFiat } from "@taostats/util/formatFiat"
import { shortenAddress } from "@taostats/util/shortenAddress"
import { api } from "@ui/api"
import { AnalyticsEventName, AnalyticsPage, sendAnalyticsEvent } from "@ui/api/analytics"
import { AccountContextMenu } from "@ui/domains/Account/AccountContextMenu"
import { AccountIcon } from "@ui/domains/Account/AccountIcon"
import { AccountTypeIcon } from "@ui/domains/Account/AccountTypeIcon"
import { FolderContextMenu } from "@ui/domains/Account/FolderContextMenu"
import { currencyConfig } from "@ui/domains/Asset/currencyConfig"
import { useCopyAddressModal } from "@ui/domains/CopyAddress"
import { useRevealableBalance } from "@ui/hooks/useRevealableBalance"
import { useToggleCurrency } from "@ui/hooks/useToggleCurrency"
import { useBalances, useSelectedCurrency, useSetting, useAccounts } from "@ui/state"

import { usePortfolioNavigation } from "./usePortfolioNavigation"
import { IS_EMBEDDED_POPUP } from "@ui/util/constants"
import { closeWalletSurface } from "@ui/util/closeWalletSurface"
import { copyAddress } from "@ui/util/copyAddress"
import { buildSendFundsRoute } from "@ui/util/sendFundsNavigation"

const PortfolioFullWidthSeparator: FC = () => (
  <div className="border-primary w-full border-b" aria-hidden />
)

const SelectionScope: FC<{ account: Account | null; folder?: TreeFolder | null }> = ({
  account,
  folder,
}) => {
  const { t } = useTranslation()

  if (account)
    return (
      <div className="flex min-w-0 grow items-center gap-1.5 overflow-hidden">
        <AccountIcon
          className="shrink-0 text-[20px]"
          address={account.address}
          genesisHash={getAccountGenesisHash(account)}
        />
        <div className="text-fg-primary truncate text-sm font-semibold">
          {account.name ?? shortenAddress(account.address)}
        </div>
        <AccountTypeIcon type={account.type} className="text-fg-brand shrink-0" />
      </div>
    )

  if (folder)
    return (
      <div className="flex min-w-0 grow items-center gap-1.5 overflow-hidden">
        <div className="bg-secondary rounded-xs flex size-5 shrink-0 items-center justify-center">
          <Folder className="text-fg-brand shrink-0 text-xs" />
        </div>
        <div className="text-fg-primary truncate text-sm font-semibold">{folder.name}</div>
      </div>
    )

  return <div className="text-fg-primary text-sm font-semibold">{t("All Accounts")}</div>
}

const HideBalancesButton: FC = () => {
  const [hideBalances, setHideBalances] = useSetting("hideBalances")

  const toggleHideBalance: MouseEventHandler<HTMLButtonElement> = useCallback(
    (event) => {
      event.stopPropagation()
      setHideBalances((prev) => !prev)
    },
    [setHideBalances],
  )

  return (
    <IconButton
      className="text-fg-tertiary hover:text-fg-primary size-7"
      onClick={toggleHideBalance}
    >
      {hideBalances ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
    </IconButton>
  )
}

const ScopeContextMenu: FC<{ account: Account | null; folder?: TreeFolder | null }> = ({
  account,
  folder,
}) => {
  if (account)
    return (
      <AccountContextMenu
        address={account.address}
        analyticsFrom="dashboard portfolio"
        placement="bottom-end"
        trigger={
          <IconButton className="text-fg-tertiary hover:text-fg-primary size-7">
            <DotsHorizontal className="size-4" />
          </IconButton>
        }
      />
    )

  if (folder)
    return (
      <FolderContextMenu
        folderId={folder.id}
        placement="bottom-end"
        trigger={
          <ContextMenuTrigger className="text-fg-tertiary hover:text-fg-primary flex size-7 items-center justify-center">
            <DotsHorizontal className="size-4" />
          </ContextMenuTrigger>
        }
      />
    )

  return null
}

const PopupSingleAccountTitleRow: FC<{
  account: Account
  onBack: () => void
}> = ({ account, onBack }) => {
  const { t } = useTranslation()

  const handleCopyAddress = useCallback(() => {
    void copyAddress(account.address)
  }, [account.address])

  return (
    <div className="flex w-full items-center gap-2 py-1">
      <IconButton
        className="text-fg-tertiary hover:text-fg-primary size-7 shrink-0"
        onClick={onBack}
      >
        <ChevronLeft className="size-4" />
      </IconButton>
      <AccountIcon
        className="shrink-0 text-[32px]"
        address={account.address}
        genesisHash={getAccountGenesisHash(account)}
      />
      <div className="flex min-w-0 grow flex-col justify-center gap-0 overflow-hidden">
        <div className="text-fg-primary truncate text-sm font-semibold">
          {account.name ?? shortenAddress(account.address)}
        </div>
        <div className="text-fg-tertiary truncate text-xs">
          {shortenAddress(account.address, 7, 6)}
        </div>
      </div>
      <Tooltip placement="bottom-end">
        <TooltipTrigger asChild>
          <IconButton
            className="text-fg-tertiary hover:text-fg-primary size-7 shrink-0"
            onClick={handleCopyAddress}
          >
            <Copy01 className="size-4" />
          </IconButton>
        </TooltipTrigger>
        <TooltipContent>{t("Copy address")}</TooltipContent>
      </Tooltip>
      <AccountContextMenu
        address={account.address}
        analyticsFrom="dashboard portfolio"
        placement="bottom-end"
        trigger={
          <IconButton className="text-fg-tertiary hover:text-fg-primary size-7 shrink-0">
            <DotsHorizontal className="size-4" />
          </IconButton>
        }
      />
    </div>
  )
}

const PortfolioBalanceDisplay: FC<{ amount: number }> = ({ amount }) => {
  const { refReveal, isHidden } = useRevealableBalance(true, true)

  const parts = useMemo(() => {
    if (isHidden) return { integer: "••••••", decimal: "" }

    const formatted = formatFiat(amount, undefined, undefined, 2)
    const sepIndex = formatted.lastIndexOf(fiatDecimalSeparator)
    if (sepIndex === -1) return { integer: formatted, decimal: "" }

    return {
      integer: formatted.slice(0, sepIndex),
      decimal: formatted.slice(sepIndex),
    }
  }, [amount, isHidden])

  return (
    <span
      ref={refReveal}
      className={classNames(
        "flex min-w-0 items-baseline overflow-visible",
        isHidden && "cursor-pointer",
      )}
    >
      <span
        className={classNames(
          "text-fg-brand text-display-md font-medium leading-none",
          !isHidden &&
            "[text-shadow:0_0_12px_rgba(0,219,188,0.9),0_0_28px_rgba(0,219,188,0.65),0_0_48px_rgba(0,219,188,0.4)]",
        )}
      >
        {parts.integer}
      </span>
      {parts.decimal && (
        <span className="text-fg-brand text-display-xs font-medium leading-none opacity-50">
          {parts.decimal}
        </span>
      )}
    </span>
  )
}

const PortfolioChange: FC<{
  change: { diff: number; ratio: number } | null
}> = ({ change }) => {
  const currency = useSelectedCurrency()

  if (!change || (change.diff === 0 && change.ratio === 0)) return null

  const isPositive = change.diff >= 0
  const absDiff = Math.abs(change.diff)
  const diffFormatted =
    currency === "tao"
      ? `${currencyConfig.tao.symbol}${formatFiat(absDiff, undefined, undefined, 2)}`
      : formatFiat(absDiff, currency, "narrowSymbol", 2)
  const signedDiff = `${isPositive ? "+" : "-"}${diffFormatted}`

  return (
    <div className="gap-md flex items-center">
      <span className="text-fg-tertiary text-sm">{signedDiff}</span>
      {/* `ratio` is already in percentage points (same units as TokenRateData.change24h). */}
      <PercentChangePill value={change.ratio} />
    </div>
  )
}

export type PortfolioHeaderProps = {
  className?: string
  variant?: "dashboard" | "popup"
  disabled?: boolean
  onNavigate?: () => void
  onBack?: () => void
}

export const DashboardPortfolioHeader: FC<PortfolioHeaderProps> = ({
  className,
  variant = "dashboard",
  disabled,
  onNavigate,
  onBack,
}) => {
  const { t } = useTranslation()
  const isPopup = variant === "popup"
  const { selectedAccount, selectedFolder } = usePortfolioNavigation()
  const showTotalPortfolioTitle = isPopup && !onBack
  const showSingleAccountPopupTitle = isPopup && !!onBack && !!selectedAccount && !selectedFolder
  const allBalances = useBalances()
  const portfolioBalances = useBalances("portfolio")

  const currency = useSelectedCurrency()
  const toggleCurrency = useToggleCurrency()

  const displayBalances = useMemo(() => {
    if (selectedAccount) return allBalances.find({ address: selectedAccount.address })
    if (selectedFolder)
      return allBalances.find(selectedFolder.tree.map((account) => ({ address: account.address })))
    return portfolioBalances
  }, [allBalances, portfolioBalances, selectedAccount, selectedFolder])

  const selectedTotal = displayBalances.sum.fiat(currency).total ?? 0
  const change24h = displayBalances.sum.change24h(currency).total

  const balanceSection = showSingleAccountPopupTitle ? (
    <div className="flex w-full items-start justify-between gap-3">
      <div className="gap-sm flex min-w-0 flex-col">
        <div className="gap-md flex w-full max-w-full items-center">
          <Button
            type="button"
            color="secondary"
            iconOnly
            className={classNames(
              "pointer-events-auto",
              currencyConfig[currency]?.symbol?.length > 2 && "text-xs",
            )}
            onClick={(event) => {
              event.stopPropagation()
              toggleCurrency()
            }}
          >
            {currencyConfig[currency]?.symbol}
          </Button>
          <PortfolioBalanceDisplay amount={selectedTotal} />
        </div>
        <PortfolioChange change={change24h} />
      </div>
      <HideBalancesButton />
    </div>
  ) : (
    <>
      <div className="gap-md flex w-full max-w-full items-center">
        <Button
          type="button"
          color="secondary"
          iconOnly
          className={classNames(
            "pointer-events-auto",
            currencyConfig[currency]?.symbol?.length > 2 && "text-xs",
          )}
          onClick={(event) => {
            event.stopPropagation()
            toggleCurrency()
          }}
        >
          {currencyConfig[currency]?.symbol}
        </Button>
        <PortfolioBalanceDisplay amount={selectedTotal} />
      </div>
      <PortfolioChange change={change24h} />
    </>
  )

  const headerCard = (
    <SurfaceCard className={classNames("gap-lg p-xl z-0 flex flex-col", className)}>
      {!showSingleAccountPopupTitle && (
        <div className="gap-md z-[1] flex w-full items-center justify-between">
          <div className="gap-xs flex min-w-0 grow items-center overflow-hidden">
            {onBack && (
              <IconButton
                className="text-fg-tertiary hover:text-fg-primary size-7 shrink-0"
                onClick={onBack}
              >
                <ChevronLeft className="size-4" />
              </IconButton>
            )}
            {showTotalPortfolioTitle ? (
              <div className="text-fg-primary text-sm font-semibold">{t("Total Portfolio")}</div>
            ) : (
              <SelectionScope folder={selectedFolder} account={selectedAccount} />
            )}
          </div>
          <div className="gap-xs flex shrink-0 items-center">
            <HideBalancesButton />
            {(!isPopup || selectedAccount || selectedFolder) && (
              <ScopeContextMenu account={selectedAccount} folder={selectedFolder} />
            )}
            {showTotalPortfolioTitle && IS_EMBEDDED_POPUP && <PopoutButton />}
          </div>
        </div>
      )}

      {isPopup && onNavigate ? (
        <button
          type="button"
          className={classNames(
            "gap-sm z-[1] flex w-full flex-col text-left",
            !disabled && "cursor-pointer",
            disabled && "cursor-default opacity-60",
          )}
          onClick={!disabled ? onNavigate : undefined}
          disabled={disabled}
        >
          {balanceSection}
        </button>
      ) : (
        <div className="gap-sm z-[1] flex w-full flex-col">{balanceSection}</div>
      )}

      <TopActions variant={variant} disabled={disabled} />
    </SurfaceCard>
  )

  if (showSingleAccountPopupTitle && selectedAccount && onBack) {
    return (
      <div className="flex flex-col gap-3">
        <div className="px-2">
          <PopupSingleAccountTitleRow account={selectedAccount} onBack={onBack} />
        </div>
        <PortfolioFullWidthSeparator />
        <div className="px-2">{headerCard}</div>
      </div>
    )
  }

  return headerCard
}

const PopoutButton: FC = () => {
  const handleClick = useCallback(() => {
    api.popupOpen("#/portfolio")
    void closeWalletSurface()
  }, [])

  return (
    <IconButton className="text-fg-tertiary hover:text-fg-primary size-7 p-1" onClick={handleClick}>
      <PopoutIcon className="size-4" />
    </IconButton>
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

const Action: FC<ActionProps & { analyticsPage: AnalyticsPage }> = ({
  analyticsName,
  analyticsAction,
  label,
  tooltip,
  icon: Icon,
  onClick,
  disabled,
  disabledReason,
  analyticsPage,
}) => {
  const handleClick: MouseEventHandler<HTMLButtonElement> = useCallback(
    (event) => {
      event.stopPropagation()
      sendAnalyticsEvent({
        ...analyticsPage,
        name: analyticsName,
        action: analyticsAction,
      })
      onClick()
    },
    [onClick, analyticsAction, analyticsName, analyticsPage],
  )

  return (
    <Tooltip placement="bottom-start">
      <TooltipTrigger asChild>
        <Button
          type="button"
          color="secondary"
          fullWidth
          size="header"
          className="pointer-events-auto font-medium disabled:cursor-not-allowed disabled:opacity-50"
          onClick={handleClick}
          disabled={disabled}
          icon={Icon}
        >
          {label}
        </Button>
      </TooltipTrigger>
      {(!!disabledReason || !!tooltip) && (
        <TooltipContent>{disabledReason || tooltip}</TooltipContent>
      )}
    </Tooltip>
  )
}

const ANALYTICS_PAGE_DASHBOARD: AnalyticsPage = {
  container: "Fullscreen",
  feature: "Portfolio",
  featureVersion: 2,
  page: "Portfolio Home",
}

const ANALYTICS_PAGE_POPUP: AnalyticsPage = {
  container: "Popup",
  feature: "Portfolio",
  featureVersion: 2,
  page: "Portfolio Home",
}

const TopActions: FC<{ variant?: "dashboard" | "popup"; disabled?: boolean }> = ({
  variant = "dashboard",
  disabled: disabledProp,
}) => {
  const { selectedAccounts, selectedAccount } = usePortfolioNavigation()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { open: openCopyAddressModal } = useCopyAddressModal()
  const isPopup = variant === "popup"
  const ownedAccounts = useAccounts("owned")
  const analyticsPage = isPopup ? ANALYTICS_PAGE_POPUP : ANALYTICS_PAGE_DASHBOARD

  const [disableActions, disabledReason] = useMemo(() => {
    if (disabledProp && isPopup)
      return [true, t("Add an account to send or receive funds") as string]

    if (!!selectedAccount && !isAccountOwned(selectedAccount))
      return [true, t("Cannot send or receive funds on accounts that you don't own") as string]

    if (!selectedAccounts.some(isAccountOwned))
      return [true, t("Cannot send or receive funds on accounts that you don't own") as string]

    if (isPopup && !ownedAccounts.length)
      return [true, t("Add an account to send or receive funds") as string]

    return [false, ""]
  }, [disabledProp, isPopup, ownedAccounts.length, selectedAccount, selectedAccounts, t])

  const selectedAddress = useMemo(() => selectedAccount?.address, [selectedAccount?.address])

  const match = useMatch("/portfolio/tokens/:symbol")
  const symbol = useMemo(() => match?.params.symbol, [match])

  const topActions = useMemo<ActionProps[]>(
    () =>
      [
        {
          analyticsName: "Goto" as const,
          analyticsAction: "Send Funds button",
          label: t("Send"),
          icon: ArrowUpRight,
          onClick: () =>
            isPopup
              ? navigate(
                  buildSendFundsRoute({
                    from: selectedAddress,
                    tokenSymbol: symbol || undefined,
                  }),
                )
              : void api.sendFundsOpen({
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
          icon: ArrowDownLeft,
          onClick: () =>
            openCopyAddressModal({
              address: selectedAddress,
            }),
          disabled: !selectedAccounts.length,
        },
        {
          analyticsName: "Goto" as const,
          analyticsAction: "swap",
          label: t("Swap"),
          icon: SwitchVertical01,
          onClick: () => window.open(TAOSTATS_WEB_APP_SWAP_URL, "_blank"),
          disabled: disableActions,
          disabledReason,
        },
      ].filter(isNotNil),
    [
      t,
      disableActions,
      disabledReason,
      isPopup,
      navigate,
      selectedAccount,
      selectedAccounts.length,
      selectedAddress,
      symbol,
      openCopyAddressModal,
    ],
  )

  return (
    <div className="gap-sm z-[1] grid w-full grid-cols-3">
      {topActions.map((action, index) => (
        <Action key={index} {...action} analyticsPage={analyticsPage} />
      ))}
    </div>
  )
}
