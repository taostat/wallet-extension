import { classNames } from "@taostats-wallet/util"
import { ChevronRight } from "@untitledui/icons/ChevronRight"
import { DotsHorizontal } from "@untitledui/icons/DotsHorizontal"
import { Eye } from "@untitledui/icons/Eye"
import { FolderPlus } from "@untitledui/icons/FolderPlus"
import { Plus } from "@untitledui/icons/Plus"
import {
  AccountsCatalogTree,
  AccountType,
  getAccountGenesisHash,
  getAccountSignetUrl,
  isAccountPortfolio,
  TreeItem,
} from "extension-core"
import { FC, Fragment, ReactNode, useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useSearchParams } from "react-router-dom"
import {
  Button,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  SurfaceCard,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "taostats-ui"

import { SearchInput } from "@taostats/components/SearchInput"
import { shortenAddress } from "@taostats/util/shortenAddress"
import { AccountContextMenu } from "@ui/domains/Account/AccountContextMenu"
import { AccountFolderIcon } from "@ui/domains/Account/AccountFolderIcon"
import { AccountIconCopyAddressButton } from "@ui/domains/Account/AccountIconCopyAddressButton"
import { AccountTypeIcon } from "@ui/domains/Account/AccountTypeIcon"
import { Address } from "@ui/domains/Account/Address"
import { AllAccountsIcon } from "@ui/domains/Account/AllAccountsIcon"
import { ExportAllAccountsModal, useExportAllAccountsModal } from "@ui/domains/Account/ExportAllAccountsModal"
import { FolderContextMenu } from "@ui/domains/Account/FolderContextMenu"
import { NewFolderModal, useNewFolderModal } from "@ui/domains/Account/NewFolderModal"
import { Fiat } from "@ui/domains/Asset/Fiat"
import { usePortfolioNavigation } from "@ui/domains/Portfolio/usePortfolioNavigation"
import { useAnalytics } from "@ui/hooks/useAnalytics"
import { usePortfolioAccounts } from "@ui/hooks/usePortfolioAccounts"

const SelectionIndicator: FC<{ className?: string }> = ({ className }) => (
  <span
    className={classNames(
      "border-fg-brand flex size-4 shrink-0 items-center justify-center rounded-sm border",
      className,
    )}
    aria-hidden
  >
    <span className="bg-fg-brand size-2 rounded-[2px]" />
  </span>
)

export const DashboardAccountsSidebar: FC = () => {
  return (
    <>
      <SurfaceCard className="flex w-full flex-col gap-4 p-4" data-testid="sidebar-account-list">
        <Accounts />
      </SurfaceCard>
      <NewFolderModal />
    </>
  )
}

const Accounts = () => {
  const { t } = useTranslation()
  const [search, setSearch] = useState("")

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
              searchContent: [account?.name, item.address].filter(Boolean).join(" ").toLowerCase(),
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
              searchContent: item.name.toLowerCase(),
            }
      }

    const filterEmptyFolders = (option: AccountOption | null): option is AccountOption =>
      !!option && (option.type !== "folder" || !!option.addresses.length)

    return [
      portfolioTree.map(treeItemToOption("portfolio")).filter(filterEmptyFolders),
      watchedTree.map(treeItemToOption("watched")).filter(filterEmptyFolders),
    ]
  }, [currentFolder, treeName, catalog, accounts, t, balanceTotals])

  const searchLower = search.trim().toLowerCase()
  const filteredPortfolio = useMemo(
    () =>
      searchLower
        ? allPortfolioOptions.filter((o) => o.searchContent.includes(searchLower))
        : allPortfolioOptions,
    [allPortfolioOptions, searchLower],
  )
  const filteredWatched = useMemo(
    () =>
      searchLower
        ? allWatchedOptions.filter((o) => o.searchContent.includes(searchLower))
        : allWatchedOptions,
    [allWatchedOptions, searchLower],
  )

  const { genericEvent } = useAnalytics()
  const navigate = useNavigate()
  const { open: openNewFolderModal } = useNewFolderModal()

  const handleAddAccountClick = useCallback(() => {
    genericEvent("goto add account", { from: "sidebar" })
    navigate("/accounts/add")
  }, [genericEvent, navigate])

  return (
    <>
      <div className="text-fg-primary text-lg font-bold">{t("Accounts")}</div>

      <div className="flex w-full items-center gap-2">
        <SearchInput
          containerClassName={classNames(
            "!bg-tertiary ring-transparent focus-within:border-primary h-9 w-full rounded-md border border-transparent text-sm !px-2",
            "[&>input]:text-sm [&>svg]:size-4 [&>button>svg]:size-4",
          )}
          placeholder={t("Search account or folder")}
          onChange={setSearch}
          initialValue={search}
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              color="secondary"
              iconOnly
              className="size-9"
              onClick={openNewFolderModal}
            >
              <FolderPlus className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("Add Folder")}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              color="secondary"
              iconOnly
              className="size-9"
              onClick={handleAddAccountClick}
            >
              <Plus className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("Add Account")}</TooltipContent>
        </Tooltip>
        <AccountsOverflowMenu />
      </div>

      <TreeAccounts options={filteredPortfolio} showAllAccounts={!searchLower} />
      {!!filteredWatched.length && (
        <>
          {!!filteredPortfolio.length && <div className="bg-secondary h-px" />}
          <div className="text-fg-secondary flex items-center gap-2 text-sm">
            <Eye className="size-4" />
            <div>{t("Followed only")}</div>
          </div>
          <TreeAccounts options={filteredWatched} />
        </>
      )}
    </>
  )
}

const AccountsOverflowMenu = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { genericEvent } = useAnalytics()
  const { isOpenExportAll, canExportAll, openExportAll, closeExportAll } =
    useExportAllAccountsModal()

  const handleManageAccountsClick = useCallback(() => {
    genericEvent("goto manage accounts", { from: "sidebar" })
    navigate("/settings/accounts")
  }, [genericEvent, navigate])

  return (
    <>
      <ContextMenu placement="bottom-end">
        <ContextMenuTrigger asChild>
          <Button type="button" color="secondary" iconOnly className="size-9" title={t("More")}>
            <DotsHorizontal className="size-4" />
          </Button>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={handleManageAccountsClick}>{t("Manage Accounts")}</ContextMenuItem>
          {canExportAll && (
            <ContextMenuItem onClick={openExportAll}>{t("Export all as JSON")}</ContextMenuItem>
          )}
        </ContextMenuContent>
      </ContextMenu>
      <ExportAllAccountsModal isOpen={isOpenExportAll} onClose={closeExportAll} />
    </>
  )
}

type FolderAccountOption = {
  type: "folder"
  treeName: string
  id: string
  name: string
  total?: number
  addresses: string[]
  searchContent: string
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
  searchContent: string
}

type AccountOption = FolderAccountOption | AccountAccountOption

const TreeAccounts: FC<{
  options: AccountOption[]
  showAllAccounts?: boolean
}> = ({ options, showAllAccounts }) => {
  return (
    <div className="flex w-full flex-col gap-2">
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
    <div className="group relative w-full">
      <SidebarButtonBase
        label={
          <div className="flex w-full items-center gap-1">
            <div className="truncate">{option.name ?? shortenAddress(option.address)}</div>
            <AccountTypeIcon className="text-fg-brand shrink-0" type={option.accountType} />
          </div>
        }
        logo={<div className="size-10 shrink-0" />}
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
        right={
          !isSelected ? (
            <AccountContextMenu
              address={option.address}
              analyticsFrom="sidebar"
              placement="bottom-end"
              hideManageAccounts
            />
          ) : undefined
        }
      />

      {/* Absolute positioning based on parent, to prevent a "button inside a button" situation*/}
      <AccountIconCopyAddressButton
        address={option.address}
        genesisHash={option.genesisHash}
        className="absolute left-2 top-1/2 -translate-y-1/2 text-[40px]"
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
      label={
        <div className="flex items-center gap-1">
          <span className="truncate">{option.name}</span>
          <ChevronRight className="text-fg-tertiary size-3.5 shrink-0" />
        </div>
      }
      logo={<AccountFolderIcon className="text-[40px]" />}
      fiat={<Fiat amount={option.total ?? 0} isBalance noCountUp />}
      isSelected={isSelected}
      onClick={handleClick}
      right={
        !isSelected ? (
          <FolderContextMenu
            folderId={option.id}
            noManageAccountsLink
            placement="bottom-end"
          />
        ) : undefined
      }
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
      logo={<AllAccountsIcon className="text-[40px]" />}
      fiat={<Fiat amount={portfolioTotal ?? 0} isBalance noCountUp />}
      isSelected={isSelected}
      onClick={handleClick}
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
    <div
      className={classNames(
        "relative flex h-14 w-full items-center gap-2 rounded-lg border px-2 transition-colors",
        isSelected
          ? "border-fg-brand bg-fg-brand/5"
          : "border-primary/6 hover:bg-tertiary/50 bg-transparent",
      )}
    >
      <button
        type="button"
        className="flex min-w-0 flex-1 items-center gap-2 py-2 text-left"
        onClick={onClick}
      >
        <div className="flex size-10 shrink-0 items-center justify-center text-[40px]">{logo}</div>
        <div className="flex grow flex-col justify-center gap-0.5 overflow-hidden">
          <div className="text-fg-primary truncate text-sm font-medium">{label}</div>
          <div className="text-fg-tertiary truncate text-xs">{fiat}</div>
        </div>
      </button>
      <div className="flex shrink-0 items-center pr-0.5">
        {isSelected ? <SelectionIndicator /> : right}
      </div>
    </div>
  )
}
