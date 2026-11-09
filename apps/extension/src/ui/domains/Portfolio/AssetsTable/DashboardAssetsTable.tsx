import { useVirtualizer } from "@tanstack/react-virtual"
import { Balances } from "@taostats-wallet/balances"
import { classNames } from "@taostats-wallet/util"
import { FC, useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useLocation } from "react-router-dom"

import { useScrollContainer } from "@taostats/components/ScrollContainer"
import { usePortfolioGlobalData } from "@ui/state"
import { IS_POPUP } from "@ui/util/constants"

import { usePortfolioNavigation } from "../usePortfolioNavigation"
import { AssetRow } from "./DashboardAssetRow"
import { usePortfolioSymbolBalancesByFilter } from "./usePortfolioSymbolBalances"

const AssetRowSkeleton: FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={classNames(
        "text-fg-secondary mb-2 mt-2 grid w-full grid-cols-[40%_30%_30%] border-b border-primary text-left text-base",
        className,
      )}
    >
      <div>
        <div className="flex h-[66px]">
          <div className="p-4 text-xl">
            <div className="bg-tertiary h-8 w-8 animate-pulse rounded-full"></div>
          </div>
          <div className="flex grow flex-col justify-center gap-1">
            <div className="bg-tertiary rounded-xs h-4 w-10 animate-pulse"></div>
          </div>
        </div>
      </div>
      <div></div>
      <div>
        <div className="flex h-full flex-col items-end justify-center gap-1 px-4">
          <div className="bg-tertiary rounded-xs h-4 w-[100px] animate-pulse"></div>
          <div className="bg-tertiary rounded-xs h-4 w-[60px] animate-pulse"></div>
        </div>
      </div>
    </div>
  )
}

const NoAssetsFound = () => {
  const { t } = useTranslation()
  const { selectedAccount, selectedFolder } = usePortfolioNavigation()

  return (
    <div className="text-fg-secondary mb-2 flex h-[66px] flex-col justify-center border-b border-primary p-4">
      {selectedAccount
        ? t("No assets were found on this account.")
        : selectedFolder
          ? t("No assets were found in this folder.")
          : t("No assets were found.")}
    </div>
  )
}

export const DashboardAssetsTable = () => {
  const { isInitialising } = usePortfolioGlobalData()
  const { symbolBalances } = usePortfolioSymbolBalancesByFilter("search")
  const location = useLocation()

  return (
    <div
      key={location.key}
      className={classNames("text-fg-secondary text-left text-base", !IS_POPUP && "min-w-[450px]")}
    >
      {!symbolBalances.length && !isInitialising && <NoAssetsFound />}
      <VirtualizedRows symbolBalances={symbolBalances} />
      {isInitialising && <AssetRowSkeleton />}
    </div>
  )
}

const VirtualizedRows: FC<{ symbolBalances: [string, Balances][] }> = ({ symbolBalances }) => {
  const [noCountUp, setNoCountUp] = useState(false)
  const scrollContainer = useScrollContainer()

  const getScrollElement = useCallback(() => {
    if (
      scrollContainer &&
      typeof scrollContainer === "object" &&
      "ref" in scrollContainer &&
      scrollContainer.ref.current
    ) {
      return scrollContainer.ref.current
    }

    return document.getElementById("main")
  }, [scrollContainer])

  useEffect(() => {
    const timeout = setTimeout(() => {
      // we only want count up on the first rendering of the table
      // ex: sorting or filtering rows using search box should not trigger count up
      setNoCountUp(true)
    }, 500)

    return () => clearTimeout(timeout)
  }, [])

  const virtualizer = useVirtualizer({
    count: symbolBalances.length,
    overscan: 6,
    gap: 0,
    estimateSize: () => 66,
    getScrollElement,
  })

  return (
    <div>
      <div
        className="relative w-full"
        style={{
          height: `${virtualizer.getTotalSize()}px`,
        }}
      >
        {virtualizer.getVirtualItems().map((item) => (
          <div
            key={item.key}
            className="absolute left-0 top-0 w-full"
            style={{
              height: `${item.size}px`,
              transform: `translateY(${item.start}px)`,
            }}
          >
            {!!symbolBalances[item.index] && (
              <AssetRow balances={symbolBalances[item.index][1]} noCountUp={noCountUp} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
