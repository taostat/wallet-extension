import { ToolbarSortIcon } from "@taostats-wallet/icons"
import { classNames } from "@taostats-wallet/util"
import { Globe01 } from "@untitledui/icons/Globe01"
import { LinkExternal01 } from "@untitledui/icons/LinkExternal01"
import { t } from "i18next"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuOptionItem,
  ContextMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  useOpenClose,
} from "taostats-ui"

import { SearchInput } from "@taostats/components/SearchInput"
import {
  NetworkOption,
  setPortfolioNetworkFilter,
  setPortfolioSearch,
  useAllNetworkOptions,
  usePortfolioBalances,
  usePortfolioNetworkFilter,
  usePortfolioSearch,
  useSetting,
} from "@ui/state"
import { IS_POPUP } from "@ui/util/constants"

import { NetworkLogo } from "../Networks/NetworkLogo"
import { NetworkOptionsModal } from "./NetworkOptionsModal"
import { PortfolioToolbarButton } from "./PortfolioToolbarButton"
import { usePortfolioNavigation } from "./usePortfolioNavigation"

const NetworkFilterButton = () => {
  const allNetworkOptions = useAllNetworkOptions()
  const networkFilter = usePortfolioNetworkFilter()
  const { allBalances } = usePortfolioBalances()
  const { isOpen, open, close } = useOpenClose()

  const networkOptions = useMemo<NetworkOption[]>(() => {
    const networkIds = new Set(
      allBalances.each.filter((b) => !!b.total.planck).map((b) => b.networkId),
    )
    return allNetworkOptions.filter((n) => n.networkIds.some((id) => networkIds.has(id)))
  }, [allBalances, allNetworkOptions])

  const handleChange = useCallback(
    (option: NetworkOption | null) => {
      setPortfolioNetworkFilter(option ?? undefined)
      close()
    },
    [close],
  )

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <PortfolioToolbarButton
            onClick={open}
            className={classNames(networkFilter && "text-fg-brand")}
          >
            {networkFilter ? (
              <NetworkLogo className="text-lg" networkId={networkFilter.networkIds[0]} />
            ) : (
              <Globe01 />
            )}
          </PortfolioToolbarButton>
        </TooltipTrigger>
        <TooltipContent>
          {networkFilter ? networkFilter.name : t("Filter by network")}
        </TooltipContent>
      </Tooltip>
      <NetworkOptionsModal
        onChange={handleChange}
        isOpen={isOpen}
        onClose={close}
        options={networkOptions}
        selected={networkFilter ?? null}
      />
    </>
  )
}

const PortfolioSearch = () => {
  const { t } = useTranslation()
  const search = usePortfolioSearch()

  return (
    <SearchInput
      containerClassName={classNames(
        "!bg-secondary ring-transparent focus-within:border-primary rounded-sm h-8 w-full border border-field text-xs !px-2",
        "[&>input]:text-sm [&>svg]:size-4 [&>button>svg]:size-5",
        "@2xl:[&>input]:text-base @2xl:[&>svg]:size-5",
        IS_POPUP ? "w-full" : "max-w-[374px]",
      )}
      placeholder={t("Search")}
      onChange={setPortfolioSearch}
      initialValue={search}
    />
  )
}

const TokensSortButton = () => {
  const { t } = useTranslation()
  const [sortBy, setSortBy] = useSetting("tokensSortBy")

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span>
          <ContextMenu>
            <ContextMenuTrigger asChild>
              <PortfolioToolbarButton>
                <ToolbarSortIcon />
              </PortfolioToolbarButton>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuOptionItem
                label={t("Total")}
                selected={sortBy === "total"}
                onClick={() => setSortBy("total")}
              />
              <ContextMenuOptionItem
                label={t("Available")}
                selected={sortBy === "available"}
                onClick={() => setSortBy("available")}
              />
              <ContextMenuOptionItem
                label={t("Locked")}
                selected={sortBy === "locked"}
                onClick={() => setSortBy("locked")}
              />
              <ContextMenuOptionItem
                label={t("Symbol")}
                selected={sortBy === "name"}
                onClick={() => setSortBy("name")}
              />
            </ContextMenuContent>
          </ContextMenu>
        </span>
      </TooltipTrigger>
      <TooltipContent>{t("Sort")}</TooltipContent>
    </Tooltip>
  )
}

const OpenInTaostatsButton = () => {
  const { selectedAccount } = usePortfolioNavigation()

  const handleOpenCurrentAccountInTaostats = useCallback(() => {
    if (!selectedAccount) return
    window.open(`https://dash.taostats.io/portfolio/${selectedAccount.address}`, "_blank")
  }, [selectedAccount])

  if (!selectedAccount) return null
  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <PortfolioToolbarButton onClick={handleOpenCurrentAccountInTaostats}>
            <LinkExternal01 />
          </PortfolioToolbarButton>
        </TooltipTrigger>
        <TooltipContent>Open in Taostats Portfolio Tracker</TooltipContent>
      </Tooltip>
    </>
  )
}

export const PortfolioToolbarTokens = () => {
  return (
    <div className="@container flex h-8 w-full min-w-[300px] shrink-0 items-center justify-between gap-2 overflow-hidden">
      <div className="flex grow items-center overflow-hidden">
        <PortfolioSearch />
      </div>
      <div className="flex shrink-0 gap-2">
        {!IS_POPUP && <TokensSortButton />}
        <NetworkFilterButton />
      </div>
      <OpenInTaostatsButton />
    </div>
  )
}
