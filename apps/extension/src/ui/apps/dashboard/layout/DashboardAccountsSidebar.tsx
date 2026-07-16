import { PencilIcon } from "@taostats-wallet/icons"
import { classNames } from "@taostats-wallet/util"
import { Check } from "@untitledui/icons/Check"
import { Eye } from "@untitledui/icons/Eye"
import { Plus } from "@untitledui/icons/Plus"
import {
  AccountsCatalogTree,
  AccountType,
  getAccountGenesisHash,
  getAccountSignetUrl,
  isAccountPortfolio,
  TreeItem,
} from "extension-core"
import { FC, Fragment, ReactNode, useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useSearchParams } from "react-router-dom"
import { IconButton, Tooltip, TooltipContent, TooltipTrigger } from "taostats-ui"

import { shortenAddress } from "@taostats/util/shortenAddress"
import { AccountFolderIcon } from "@ui/domains/Account/AccountFolderIcon"
import { AccountIconCopyAddressButton } from "@ui/domains/Account/AccountIconCopyAddressButton"
import { AccountsLogoStack } from "@ui/domains/Account/AccountsLogoStack"
import { AccountTypeIcon } from "@ui/domains/Account/AccountTypeIcon"
import { Address } from "@ui/domains/Account/Address"
import { AllAccountsIcon } from "@ui/domains/Account/AllAccountsIcon"
import { Fiat } from "@ui/domains/Asset/Fiat"
import { usePortfolioNavigation } from "@ui/domains/Portfolio/usePortfolioNavigation"
import { useAnalytics } from "@ui/hooks/useAnalytics"
import { usePortfolioAccounts } from "@ui/hooks/usePortfolioAccounts"

export const DashboardAccountsSidebar: FC = () => {
  return (
    <div className="bg-app-bg rounded-lg">
      <Accounts />
    </div>
  )
}

const Accounts = () => {
  const { t } = useTranslation()

  const { currentFolder, treeName } = usePortfolioNavigation()
  const { accounts, catalog, balanceTotals } = usePortfolioAccounts()

  const [allPortfolioOptions, allWatchedOptions] = useMemo((): [
    AccountOption[],
    AccountOption[],
  ] => {
    const [portfolioTree, watchedTree] = (() => {
      if (currentFolder && treeName === "portfolio")
        return [[currentFolder, ...currentFolder.tree], []]
      if (currentFolder && treeName === "watched")
        return [[], [currentFolder, ...currentFolder.tree]]
      return [catalog.portfolio, catalog.watched]
    })()

    const treeItemToOption =
      (treeName: AccountsCatalogTree) =>
      (item: TreeItem): AccountOption | null => {
        const account =
          item.type === "account"
            ? accounts.find((account) => account.address === item.address)
            : undefined

        if (item.type === "account" && !account) return null

        return item.type === "account"
          ? {
              type: "account",
              name: account?.name ?? t("Unknown Account"),
              address: item.address,
              total: balanceTotals[item.address] ?? 0,
              genesisHash: getAccountGenesisHash(account),
              accountType: account?.type,
              isPortfolio: isAccountPortfolio(account),
              signetUrl: getAccountSignetUrl(account),
            }
          : {
              type: "folder",
              treeName,
              id: item.id,
              name: item.name,
              total: item.tree.reduce(
                (sum, account) => sum + (balanceTotals[account.address] ?? 0),
                0,
              ),
              addresses: item.tree.map((account) => account.address),
            }
      }

    const filterEmptyFolders = (option: AccountOption | null): option is AccountOption =>
      !!option && (option.type !== "folder" || !!option.addresses.length)

    return [
      portfolioTree.map(treeItemToOption("portfolio")).filter(filterEmptyFolders),
      watchedTree.map(treeItemToOption("watched")).filter(filterEmptyFolders),
    ]
  }, [currentFolder, treeName, catalog, accounts, t, balanceTotals])

  const { genericEvent } = useAnalytics()
  const navigate = useNavigate()

  const handleManageAccountsClick = useCallback(() => {
    genericEvent("goto manage accounts", { from: "sidebar" })
    navigate("/settings/accounts")
  }, [genericEvent, navigate])

  const handleAddAccountClick = useCallback(() => {
    genericEvent("goto add account", { from: "sidebar" })
    navigate("/accounts/add")
  }, [genericEvent, navigate])

  return (
    <div className="flex w-full flex-col gap-4 p-4" data-testid="sidebar-account-list">
      <div className="flex h-8 shrink-0 items-center">
        <div className="grow pl-2 text-[20px] font-bold">{t("Accounts")}</div>
        <Tooltip>
          <TooltipTrigger asChild>
            <IconButton onClick={handleManageAccountsClick} className="p-1.5">
              <PencilIcon className="size-5" />
            </IconButton>
          </TooltipTrigger>
          <TooltipContent>{t("Manage Accounts")}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <IconButton onClick={handleAddAccountClick} className="p-1.5">
              <Plus className="size-5" />
            </IconButton>
          </TooltipTrigger>
          <TooltipContent>{t("Add Account")}</TooltipContent>
        </Tooltip>
      </div>
      <div className="bg-secondary h-px"></div>
      <TreeAccounts options={allPortfolioOptions} showAllAccounts />
      {!!allWatchedOptions.length && (
        <>
          {!!allPortfolioOptions.length && <div className="bg-secondary h-px"></div>}
          <div className="flex items-center gap-2">
            <Eye />
            <div className="text-sm">{t("Followed only")}</div>
          </div>
          <TreeAccounts options={allWatchedOptions} />
        </>
      )}
    </div>
  )
}

type FolderAccountOption = {
  type: "folder"
  treeName: string
  id: string
  name: string
  total?: number
  addresses: string[]
}

type AccountAccountOption = {
  type: "account"
  name: string
  address: string
  total?: number
  genesisHash?: `0x${string}` | null
  accountType?: AccountType
  isPortfolio?: boolean
  signetUrl?: string
}

type AccountOption = FolderAccountOption | AccountAccountOption

const TreeAccounts: FC<{
  options: AccountOption[]
  showAllAccounts?: boolean
}> = ({ options, showAllAccounts }) => {
  return (
    <div className="flex w-full flex-col gap-1">
      {showAllAccounts && <AllAccountsOption />}
      {options.map((option) => (
        <Fragment key={option.type === "folder" ? option.id : option.address}>
          {option.type === "account" ? (
            <AccountOption option={option} />
          ) : (
            <FolderOption option={option} />
          )}
        </Fragment>
      ))}
    </div>
  )
}

const AccountOption = ({ option }: { option: AccountAccountOption }) => {
  const [searchParams, updateSearchParams] = useSearchParams()

  const handleClick = useCallback(() => {
    searchParams.delete("folder")
    searchParams.set("account", option.address)
    updateSearchParams(searchParams, { replace: true })
  }, [option.address, searchParams, updateSearchParams])

  const isSelected = useMemo(() => {
    return searchParams.get("account") === option.address
  }, [option.address, searchParams])

  return (
    <div className="hover:bg-tertiary group relative w-full rounded-[12px]">
      <SidebarButtonBase
        label={
          <div className="flex w-full items-center gap-1">
            <div className="truncate">{option.name ?? shortenAddress(option.address)}</div>
            <AccountTypeIcon className="text-fg-brand shrink-0" type={option.accountType} />
          </div>
        }
        logo={<div className="size-10 shrink-0"></div>}
        fiat={
          <>
            <Fiat
              className="h-4 group-hover:hidden"
              amount={option.total ?? 0}
              isBalance
              noCountUp
            />
            <Address
              className="hidden group-hover:block"
              address={option.address}
              genesisHash={option.genesisHash}
              noTooltip
              startCharCount={6}
              endCharCount={6}
            />
          </>
        }
        isSelected={isSelected}
        onClick={handleClick}
        right={null}
      />

      {/* Absolute positioning based on parent, to prevent a "button inside a button" situation*/}
      <AccountIconCopyAddressButton
        address={option.address}
        genesisHash={option.genesisHash}
        className="absolute left-2 top-2 text-[40px]"
        tooltipPlacement="bottom"
      />
    </div>
  )
}

const FolderOption = ({ option }: { option: FolderAccountOption }) => {
  const [searchParams, updateSearchParams] = useSearchParams()

  const handleClick = useCallback(() => {
    searchParams.delete("account")
    searchParams.set("folder", option.id)
    updateSearchParams(searchParams, { replace: true })
  }, [option.id, searchParams, updateSearchParams])

  const isSelected = useMemo(() => {
    return searchParams.get("folder") === option.id
  }, [option.id, searchParams])

  return (
    <SidebarButtonBase
      label={option.name}
      logo={<AccountFolderIcon />}
      fiat={<Fiat amount={option.total ?? 0} isBalance noCountUp />}
      isSelected={isSelected}
      onClick={handleClick}
      right={<AccountsLogoStack addresses={option.addresses} />}
    />
  )
}

const AllAccountsOption = () => {
  const { t } = useTranslation()
  const { portfolioTotal } = usePortfolioAccounts()

  const [searchParams, updateSearchParams] = useSearchParams()

  const handleClick = useCallback(() => {
    searchParams.delete("account")
    searchParams.delete("folder")
    updateSearchParams(searchParams, { replace: true })
  }, [searchParams, updateSearchParams])

  const isSelected = useMemo(() => {
    return !searchParams.get("account") && !searchParams.get("folder")
  }, [searchParams])

  return (
    <SidebarButtonBase
      label={t("All Accounts")}
      logo={<AllAccountsIcon />}
      fiat={<Fiat amount={portfolioTotal ?? 0} isBalance noCountUp />}
      isSelected={isSelected}
      onClick={handleClick}
      right={null}
    />
  )
}

const SidebarButtonBase: FC<{
  logo: ReactNode
  label: ReactNode
  fiat: ReactNode
  right?: ReactNode
  isSelected: boolean
  onClick: () => void
}> = ({ logo, label, fiat, right, isSelected, onClick }) => {
  return (
    <button
      type="button"
      className={classNames(
        "hover:bg-tertiary flex h-14 w-full items-center gap-2 rounded-[12px] px-2 text-left",
        isSelected && "bg-secondary",
      )}
      onClick={onClick}
    >
      <div className="size-10 text-[40px]">{logo}</div>
      <div className="flex grow flex-col justify-center gap-0.5 overflow-hidden">
        <div className="text-fg-tertiary truncate">{label}</div>
        <div className="text-fg-disabled truncate text-xs">{fiat}</div>
      </div>
      <div>
        {isSelected ? (
          <div className="bg-fg-brand flex size-5 items-center justify-center rounded-full text-xs text-black">
            <Check />
          </div>
        ) : (
          right
        )}
      </div>
    </button>
  )
}
