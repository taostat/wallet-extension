import { isEthereumAddress } from "@polkadot/util-crypto"
import { bind } from "@react-rxjs/core"
import { PencilIcon } from "@taostats-wallet/icons"
import { classNames } from "@taostats-wallet/util"
import { ChevronLeft } from "@untitledui/icons/ChevronLeft"
import { ChevronRight } from "@untitledui/icons/ChevronRight"
import { Eye } from "@untitledui/icons/Eye"
import { Plus } from "@untitledui/icons/Plus"
import { Settings01 } from "@untitledui/icons/Settings01"
import {
  Account,
  AccountsCatalogTree,
  AccountType,
  getAccountGenesisHash,
  getAccountSignetUrl,
  isAccountPortfolio,
  TreeFolder,
  TreeItem,
} from "extension-core"
import { FC, Suspense, useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { BehaviorSubject } from "rxjs"
import { IconButton, Tooltip, TooltipContent, TooltipTrigger } from "taostats-ui"

import { SearchInput } from "@taostats/components/SearchInput"
import { SuspenseTracker } from "@taostats/components/SuspenseTracker"
import { api } from "@ui/api"
import { AnalyticsPage, sendAnalyticsEvent } from "@ui/api/analytics"
import { AllAccountsHeader } from "@ui/apps/popup/components/AllAccountsHeader"
import { AccountFolderIcon } from "@ui/domains/Account/AccountFolderIcon"
import { AccountIconCopyAddressButton } from "@ui/domains/Account/AccountIconCopyAddressButton"
import { AccountsLogoStack } from "@ui/domains/Account/AccountsLogoStack"
import { AccountTypeIcon } from "@ui/domains/Account/AccountTypeIcon"
import { Address } from "@ui/domains/Account/Address"
import { CurrentAccountAvatar } from "@ui/domains/Account/CurrentAccountAvatar"
import { Fiat } from "@ui/domains/Asset/Fiat"
import { GetStarted } from "@ui/domains/Portfolio/GetStarted/GetStarted"
import { PortfolioToolbarButton } from "@ui/domains/Portfolio/PortfolioToolbarButton"
import { usePortfolioNavigation } from "@ui/domains/Portfolio/usePortfolioNavigation"
import { useAnalytics } from "@ui/hooks/useAnalytics"
import { usePortfolioAccounts } from "@ui/hooks/usePortfolioAccounts"
import { useBalances } from "@ui/state"
import { closeWalletSurface } from "@ui/util/closeWalletSurface"

import { AuthorisedSiteToolbar } from "../../components/AuthorisedSiteToolbar"
import { PopupHomeBanners } from "../../components/banners/PopupHomeBanners"
import { useQuickSettingsOpenClose } from "../../components/Navigation/QuickSettings"

const portfolioAccountsSearch$ = new BehaviorSubject("")

const setPortfolioAccountsSearch = (search: string) => {
  portfolioAccountsSearch$.next(search)
}

const [usePortfolioAccountsSearch] = bind(portfolioAccountsSearch$)

const ANALYTICS_PAGE: AnalyticsPage = {
  container: "Popup",
  feature: "Portfolio",
  featureVersion: 2,
  page: "Portfolio Home",
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

const FolderButton: FC<{ option: FolderAccountOption }> = ({ option }) => {
  const navigate = useNavigate()

  const handleClick = useCallback(() => {
    navigate(`/portfolio?folder=${option.id}`)
  }, [navigate, option])

  return (
    <button
      type="button"
      tabIndex={0}
      className={classNames(
        "text-fg-secondary bg-secondary hover:bg-secondary hover:text-fg-primary flex h-[59px] w-full cursor-pointer items-center gap-3 overflow-hidden rounded-sm px-3",
      )}
      onClick={handleClick}
    >
      <div className="flex flex-col justify-center text-xl">
        <AccountFolderIcon />
      </div>
      <div className="flex grow flex-col items-start justify-center gap-0.5 overflow-hidden">
        <div className="text-fg-primary flex w-full items-center gap-1.5 text-base">
          <div className="truncate">{option.name}</div>
        </div>
        <div className="text-fg-secondary flex w-full truncate text-left text-sm">
          <Fiat amount={option.total} isBalance />
        </div>
      </div>
      <AccountsLogoStack className="text-sm" addresses={option.addresses} />
    </button>
  )
}

const AccountButton: FC<{ option: AccountAccountOption }> = ({ option }) => {
  const navigate = useNavigate()
  const { genericEvent } = useAnalytics()

  const handleClick = useCallback(() => {
    genericEvent("select account(s)", {
      type: option.address ? (isEthereumAddress(option.address) ? "ethereum" : "substrate") : "all",
      from: "popup",
    })
    navigate(`/portfolio/tokens?account=${option.address}`)
  }, [genericEvent, navigate, option])

  return (
    <div
      className={classNames(
        "group",
        "bg-secondary hover:bg-secondary relative h-[59px] w-full rounded-sm",
      )}
    >
      <button
        type="button"
        tabIndex={0}
        className={classNames(
          "text-fg-secondary hover:text-fg-primary flex h-[59px] w-full cursor-pointer items-center gap-3 overflow-hidden rounded-sm px-3",
        )}
        onClick={handleClick}
      >
        <div className="flex flex-col justify-center text-xl">
          <div className="size-[32px]"></div>
        </div>
        <div className="flex grow flex-col items-start justify-center gap-0.5 overflow-hidden">
          <div className="text-fg-primary flex w-full items-center gap-1.5 text-base">
            <div className="truncate">{option.name}</div>
            <AccountTypeIcon
              className="text-fg-brand"
              type={option.accountType}
              signetUrl={option.signetUrl}
            />
          </div>
          <div className="text-fg-secondary flex w-full truncate text-left text-sm">
            <Fiat amount={option.total} isBalance className="group-hover:hidden" />
            <Address
              className="hidden truncate group-hover:block"
              address={option.address}
              genesisHash={option.genesisHash}
              noTooltip
              startCharCount={6}
              endCharCount={6}
            />
          </div>
        </div>

        <div className="text-lg">
          <ChevronRight />
        </div>
      </button>
      {/* Absolute positioning based on parent, to prevent a "button inside a button" situation */}
      <div className="absolute left-3 top-0 flex h-[59px] flex-col justify-center">
        <div className="relative size-[32px] text-xl">
          <AccountIconCopyAddressButton address={option.address} genesisHash={option.genesisHash} />
        </div>
      </div>
    </div>
  )
}

const AccountsToolbar = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const search = usePortfolioAccountsSearch()

  const handleAddAccountClick = useCallback(() => {
    sendAnalyticsEvent({
      ...ANALYTICS_PAGE,
      name: "Goto",
      action: "Add account button",
    })
    api.dashboardOpen("/accounts/add")
    void closeWalletSurface()
  }, [])

  const handleManageAccountsClick = useCallback(() => {
    sendAnalyticsEvent({
      ...ANALYTICS_PAGE,
      name: "Goto",
      action: "Manage Accounts button",
    })
    navigate("/manage-accounts")
  }, [navigate])

  useEffect(() => {
    // clear on unmount
    return () => {
      portfolioAccountsSearch$.next("")
    }
  }, [])

  const { open: openSettings } = useQuickSettingsOpenClose()

  return (
    <div className="flex w-full items-center justify-between gap-2 overflow-hidden">
      <div className="flex grow items-center overflow-hidden">
        <SearchInput
          containerClassName={classNames(
            "!bg-secondary ring-transparent focus-within:border-primary rounded-sm h-[32px] w-full border border-field text-sm !px-2",
            "[&>input]:text-sm [&>svg]:size-4 [&>button>svg]:size-5",
          )}
          placeholder={t("Search account or folder")}
          onChange={setPortfolioAccountsSearch}
          initialValue={search}
        />
      </div>
      <Tooltip placement="bottom">
        <TooltipTrigger asChild>
          <PortfolioToolbarButton onClick={handleAddAccountClick}>
            <Plus />
          </PortfolioToolbarButton>
        </TooltipTrigger>
        <TooltipContent>{t("Add account")}</TooltipContent>
      </Tooltip>
      <Tooltip placement="bottom-end">
        <TooltipTrigger asChild>
          <PortfolioToolbarButton onClick={handleManageAccountsClick}>
            <PencilIcon />
          </PortfolioToolbarButton>
        </TooltipTrigger>
        <TooltipContent>{t("Manage accounts")}</TooltipContent>
      </Tooltip>
      <Tooltip placement="bottom-end">
        <TooltipTrigger asChild>
          <PortfolioToolbarButton onClick={openSettings}>
            <Settings01 />
          </PortfolioToolbarButton>
        </TooltipTrigger>
        <TooltipContent>{t("Settings")}</TooltipContent>
      </Tooltip>
    </div>
  )
}

const AccountsList = ({ className, options }: { className?: string; options: AccountOption[] }) => {
  return (
    <div className={classNames("flex w-full flex-col gap-2", className)}>
      {options.map((option) =>
        option.type === "folder" ? (
          <FolderButton key={option.id} option={option} />
        ) : (
          <AccountButton key={`account-${option.address}`} option={option} />
        ),
      )}
    </div>
  )
}

const Accounts = ({
  accounts,
  folder,
  folderTotal,
  portfolioOptions,
  watchedOptions,
}: {
  accounts: Account[]
  folder?: TreeFolder | null
  folderTotal?: number
  portfolioOptions: AccountOption[]
  watchedOptions: AccountOption[]
}) => {
  const { t } = useTranslation()

  const hasPortfolioOptions = portfolioOptions.length > 0
  const hasWatchedOptions = watchedOptions.length > 0
  const hasAnyAccount = accounts.length > 0

  return (
    <div className="flex w-full flex-col gap-2">
      {folder ? (
        <FolderHeader folder={folder} folderTotal={folderTotal} />
      ) : (
        <>
          <AllAccountsHeader accounts={accounts} />
          <PopupHomeBanners />
        </>
      )}

      {hasAnyAccount && <AccountsToolbar />}

      {hasPortfolioOptions && <AccountsList options={portfolioOptions} />}

      {hasWatchedOptions && (
        <div className={classNames("text-fg-secondary flex items-center gap-1 font-bold")}>
          <Eye />
          <div>{t("Followed only")}</div>
        </div>
      )}
      {hasWatchedOptions && <AccountsList options={watchedOptions} />}

      {hasAnyAccount && !portfolioOptions.length && !watchedOptions.length && (
        <div className="bg-app-bg text-fg-disabled flex h-[100px] items-center justify-center rounded-sm text-xs opacity-50">
          {t("No accounts found")}
        </div>
      )}
    </div>
  )
}

const FolderHeader = ({ folder, folderTotal }: { folder: TreeFolder; folderTotal?: number }) => {
  const navigate = useNavigate()

  return (
    <div className={"mb-3 flex w-full items-center gap-2 overflow-hidden"}>
      <IconButton onClick={() => navigate(-1)}>
        <ChevronLeft />
      </IconButton>
      <div className="flex flex-col justify-center">
        <CurrentAccountAvatar className="!text-2xl" />
      </div>
      <div className="flex grow flex-col gap-0.5 overflow-hidden pl-1 text-sm">
        <div className="flex items-center gap-1.5">
          <div className="text-fg-secondary truncate">{folder.name}</div>
        </div>
        <div className="truncate">
          <Fiat amount={folderTotal} isBalance />
        </div>
      </div>
    </div>
  )
}

// Rendering this component will fire balance subscription (& suspense)
const BalancesLoader = () => {
  useBalances()

  return null
}

export const PortfolioAccounts = () => {
  const { accounts, catalog, balanceTotals } = usePortfolioAccounts()
  const { selectedFolder: folder, treeName } = usePortfolioNavigation()
  const search = usePortfolioAccountsSearch()
  const { popupOpenEvent } = useAnalytics()
  const { t } = useTranslation()

  const [allPortfolioOptions, allWatchedOptions] = useMemo((): [
    AccountOption[],
    AccountOption[],
  ] => {
    const [portfolioTree, watchedTree] = (() => {
      if (folder && treeName === "portfolio") return [folder.tree, []]
      if (folder && treeName === "watched") return [[], folder.tree]
      return [catalog.portfolio, catalog.watched]
    })()

    const treeItemToOption =
      (treeName: AccountsCatalogTree) =>
      (item: TreeItem): AccountOption => {
        const account =
          item.type === "account"
            ? accounts.find((account) => account.address === item.address)
            : undefined

        const getSearchContent = (account?: Account) =>
          [account?.name, account?.address, account?.type?.replaceAll(/taostats/gi, "")]
            .join(" ")
            .toLowerCase()

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
              searchContent: getSearchContent(account),
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
              searchContent: item.tree
                .map((item) => {
                  const account = accounts.find((account) => account.address === item.address)
                  return getSearchContent(account)
                })
                .concat(item.name.toLowerCase())
                .join(" "),
            }
      }

    return [
      portfolioTree.map(treeItemToOption("portfolio")),
      watchedTree.map(treeItemToOption("watched")),
    ]
  }, [folder, treeName, catalog.portfolio, catalog.watched, accounts, t, balanceTotals])

  const ls = useMemo(() => search.toLowerCase(), [search])

  const searchFilter = useCallback(
    (option: AccountOption): boolean => {
      return !search || option.searchContent.includes(ls)
    },
    [ls, search],
  )

  const [portfolioOptions, watchedOptions] = useMemo(
    () => [allPortfolioOptions.filter(searchFilter), allWatchedOptions.filter(searchFilter)],
    [allPortfolioOptions, allWatchedOptions, searchFilter],
  )

  const folderTotal = useMemo(
    () =>
      folder
        ? folder.tree.reduce((sum, account) => sum + (balanceTotals[account.address] ?? 0), 0)
        : undefined,
    [balanceTotals, folder],
  )

  useEffect(() => {
    popupOpenEvent("portfolio accounts")
  }, [popupOpenEvent])

  const [fetchBalances, setFetchBalances] = useState(false)
  useEffect(() => {
    // start fetching balances 100ms after first render
    const timeout = setTimeout(() => {
      setFetchBalances(true)
    }, 100)

    return () => clearTimeout(timeout)
  }, [])

  return (
    <>
      {!folder && <AuthorisedSiteToolbar />}
      <Accounts
        accounts={accounts}
        folder={folder}
        folderTotal={folderTotal}
        portfolioOptions={portfolioOptions}
        watchedOptions={watchedOptions}
      />
      {!search && <GetStarted />}
      {fetchBalances && (
        <Suspense fallback={<SuspenseTracker name="BalancesLoader" />}>
          <BalancesLoader />
        </Suspense>
      )}
    </>
  )
}
