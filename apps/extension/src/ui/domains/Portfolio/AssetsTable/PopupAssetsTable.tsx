import { useVirtualizer } from "@tanstack/react-virtual"
import { Balances } from "@taostats-wallet/balances"
import { classNames } from "@taostats-wallet/util"
import { Lock01 } from "@untitledui/icons/Lock01"
import { FC, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { Accordion, AccordionIcon } from "@taostats/components/Accordion"
import { FadeIn } from "@taostats/components/FadeIn"
import { useScrollContainer } from "@taostats/components/ScrollContainer"
import { useOpenClose } from "@taostats/hooks/useOpenClose"
import { AssetPrice } from "@ui/domains/Asset/AssetPrice"
import { BalanceSeparator } from "@ui/domains/Asset/BalanceSeparator"
import { Fiat } from "@ui/domains/Asset/Fiat"
import { TokenDisplaySymbol } from "@ui/domains/Asset/TokenDisplaySymbol"
import { Tokens } from "@ui/domains/Asset/Tokens"
import { useStakeButton } from "@ui/domains/Staking/Stake/hooks/useStakeButton"
import { StakePillButton } from "@ui/domains/Staking/Stake/StakePillButton"
import { useAnalytics } from "@ui/hooks/useAnalytics"
import { useBalancesStatus } from "@ui/hooks/useBalancesStatus"
import { useNavigateWithQuery } from "@ui/hooks/useNavigateWithQuery"
import { useUniswapV2LpTokenTotalValueLocked } from "@ui/hooks/useUniswapV2LpTokenTotalValueLocked"
import { useNetworkById, usePortfolioGlobalData, useSelectedCurrency } from "@ui/state"

import { TokenLogo } from "../../Asset/TokenLogo"
import { BittensorUnstakeButton } from "../AssetDetails/BittensorUnstakeButton"
import { StaleBalancesIcon } from "../StaleBalancesIcon"
import { usePortfolioDisplayBalances } from "../useDisplayBalances"
import { usePortfolioNavigation } from "../usePortfolioNavigation"
import { useTokenBalancesSummary } from "../useTokenBalancesSummary"
import { usePortfolioSymbolBalancesByFilter } from "./usePortfolioSymbolBalances"

const AssetRowSkeleton = ({ className }: { className?: string }) => {
  return (
    <div
      className={classNames(
        "bg-secondary mt-2 flex h-14 items-center gap-3 rounded-sm px-3",
        className,
      )}
    >
      <div className="bg-tertiary h-8 w-8 animate-pulse rounded-full px-3 text-xl"></div>
      <div className="grow space-y-0.5">
        <div className="flex justify-between gap-0.5">
          <div className="bg-tertiary rounded-xs h-3.5 w-10 animate-pulse"></div>
          <div className="bg-tertiary rounded-xs h-3.5 w-[100px] animate-pulse"></div>
        </div>
        <div className="flex justify-between gap-0.5">
          <div className="bg-tertiary rounded-xs h-3.5 w-5 animate-pulse"></div>
          <div className="bg-tertiary rounded-xs h-3.5 w-[60px] animate-pulse"></div>
        </div>
      </div>
    </div>
  )
}

const AssetRow: FC<{
  balances: Balances
  noCountUp: boolean
  locked?: boolean
}> = ({ balances, locked, noCountUp }) => {
  const { genericEvent } = useAnalytics()

  const status = useBalancesStatus(balances)

  const { token, summary, rate } = useTokenBalancesSummary(balances)
  const network = useNetworkById(token?.networkId)

  const navigate = useNavigateWithQuery()
  const handleClick = useCallback(() => {
    if (!token) return

    // Prefer using netuid for dTAO (substrate-dtao) tokens so we can distinguish subnets.
    if (token.type === "substrate-dtao") {
      const netuidValue = token.netuid
      navigate(`/portfolio/tokens/${netuidValue}`)
      genericEvent("goto portfolio asset", {
        from: "popup",
        symbol: token.symbol,
        netuid: netuidValue,
      })
      return
    }

    // Fallback: use symbol for non-dTAO tokens.
    navigate(`/portfolio/tokens/${encodeURIComponent(token.symbol)}`)
    genericEvent("goto portfolio asset", {
      from: "popup",
      symbol: token.symbol,
    })
  }, [genericEvent, navigate, token])

  const { tokens, fiat } = useMemo(() => {
    return {
      tokens: locked ? summary.lockedTokens : summary.availableTokens,
      fiat: locked ? summary.lockedFiat : summary.availableFiat,
    }
  }, [
    locked,
    summary.availableFiat,
    summary.availableTokens,
    summary.lockedFiat,
    summary.lockedTokens,
  ])

  const { t } = useTranslation()

  const isUniswapV2LpToken = token?.type === "evm-uniswapv2"
  const tvl = useUniswapV2LpTokenTotalValueLocked(token, rate?.price, balances)

  const { canStake } = useStakeButton({ balances })
  const showStakingButton = canStake && !locked

  if (!token || !summary || !network) return null

  return (
    <div className="group relative h-14 w-full">
      <button
        type="button"
        className="bg-secondary hover:bg-secondary flex size-full items-center overflow-hidden rounded-sm"
        onClick={handleClick}
      >
        <div className="shrink-0 p-3 text-xl">
          <TokenLogo tokenId={token.id} />
        </div>
        <div className="relative flex grow items-center gap-2 overflow-hidden pr-3">
          <div className="flex grow flex-col gap-1 overflow-hidden text-left">
            <div className="flex w-full items-center gap-1.5 overflow-hidden">
              <div className="text-fg-primary flex w-full items-center gap-1.5 overflow-hidden text-sm font-bold">
                <div className="truncate">
                  <TokenDisplaySymbol tokenId={token.id} />
                </div>
                {!!network.isTestnet && (
                  <div className="text-tiny bg-orange-secondary/10 text-fg-orange shrink-0 rounded px-1.5 py-0.5 font-light">
                    {t("Testnet")}
                  </div>
                )}
              </div>
            </div>

            {isUniswapV2LpToken && typeof tvl === "number" && (
              <div className="text-fg-secondary whitespace-nowrap text-xs">
                <Fiat amount={tvl} noCountUp={noCountUp} />{" "}
                <span className="text-[8px]">TVL</span>
              </div>
            )}
            {!isUniswapV2LpToken && token.type === "substrate-dtao" && (
              <div className="text-fg-secondary flex items-center gap-1 whitespace-nowrap text-xs">
                <span>{`SN${token.netuid}`}</span>
                <BalanceSeparator />
                <AssetPrice tokenId={token.id} balances={balances} noChange as="span" />
              </div>
            )}
            {!isUniswapV2LpToken && token.type !== "substrate-dtao" && (
              <AssetPrice
                tokenId={token.id}
                balances={balances}
                className="text-fg-secondary text-xs"
              />
            )}
          </div>
          <div
            className={classNames(
              "flex min-w-[80px] shrink-0 flex-col items-end gap-1 text-right",
              status.status === "fetching" && "animate-pulse transition-opacity",
            )}
          >
            <div
              className={classNames(
                "whitespace-nowrap text-sm font-bold",
                locked ? "text-fg-secondary" : "text-white",
                showStakingButton && "group-hover:hidden",
              )}
            >
              <Tokens
                amount={tokens}
                symbol={isUniswapV2LpToken ? "" : token?.symbol}
                noCountUp={noCountUp}
                isBalance
              />
              {locked ? <Lock01 className="lock ml-1 inline align-baseline text-xs" /> : null}
              <StaleBalancesIcon
                className="alert ml-1 inline align-baseline text-sm"
                staleChains={status.status === "stale" ? status.staleChains : []}
              />
            </div>
            <div
              className={classNames(
                "text-fg-secondary leading-base text-xs",
                showStakingButton && "group-hover:hidden",
              )}
            >
              {fiat === null ? "-" : <Fiat amount={fiat} isBalance noCountUp={noCountUp} />}
            </div>
          </div>
        </div>
      </button>
      {showStakingButton && (
        <div className="absolute right-2 top-0 hidden h-14 flex-col justify-center group-hover:flex">
          <div className="flex items-center gap-1.5">
            <StakePillButton
              balances={balances}
              isPortfolio
              className="[>svg]:text-[20px] text-sm"
            />
            <BittensorUnstakeButton
              balances={balances}
              variant="pill"
              className="[>svg]:text-[20px] text-sm"
            />
          </div>
        </div>
      )}
    </div>
  )
}

type GroupProps = {
  label: ReactNode
  fiatAmount: number
  className?: string
  children?: ReactNode
}

const BalancesGroup = ({ label, fiatAmount, className, children }: GroupProps) => {
  const { isOpen, toggle } = useOpenClose(true)

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        className={classNames("flex cursor-pointer items-center gap-1 text-sm", className)}
        onClick={toggle}
      >
        <div className="text-fg-secondary grow text-left">{label}</div>
        <div className="text-fg-secondary truncate">
          <Fiat amount={fiatAmount} isBalance />
        </div>
        <div className="text-fg-secondary text-md flex flex-col justify-center">
          <AccordionIcon isOpen={isOpen} />
        </div>
      </button>
      <Accordion alwaysRender isOpen={isOpen}>
        {children}
      </Accordion>
    </div>
  )
}

export const PopupAssetsTable = () => {
  const { t } = useTranslation()
  const { selectedAccount: account } = usePortfolioNavigation()

  const { isInitialising } = usePortfolioGlobalData()
  const balances = usePortfolioDisplayBalances("network")

  // group by status by token (symbol)
  const { availableSymbolBalances: available, lockedSymbolBalances } =
    usePortfolioSymbolBalancesByFilter("search")

  const currency = useSelectedCurrency()

  // calculate totals
  const {
    total,
    transferable: totalAvailable,
    unavailable: totalLocked,
  } = useMemo(() => balances.sum.fiat(currency), [balances.sum, currency])

  if (!available.length && !lockedSymbolBalances.length && !isInitialising)
    return (
      <FadeIn>
        <div className="text-fg-secondary bg-secondary rounded-sm py-5 text-center text-xs">
          {account ? t("No assets to display for this account.") : t("No assets to display.")}
        </div>
      </FadeIn>
    )

  return (
    <FadeIn>
      <div>
        {!!account && (
          <>
            <div className="text-md flex items-center gap-1">
              <div className="text-fg-primary grow text-left">{t("Total")}</div>
              <div className="text-fg-secondary truncate">
                <Fiat amount={total} isBalance />
              </div>
            </div>
            <div className="h-2" />
          </>
        )}
        <BalancesGroup label={t("Available")} fiatAmount={totalAvailable}>
          <VirtualizedRows rows={available} />
          {isInitialising && <AssetRowSkeleton />}
          {!isInitialising && !available.length && (
            <div className="text-fg-secondary bg-secondary rounded-sm py-5 text-center text-xs">
              {account
                ? t("There are no available balances for this account.")
                : t("There are no available balances.")}
            </div>
          )}
          <div className="h-2" />
        </BalancesGroup>
        {lockedSymbolBalances.length > 0 && (
          <BalancesGroup
            label={
              <div className="flex items-center gap-1">
                <div>{t("Locked")}</div>
                <div>
                  <Lock01 className="text-sm" />
                </div>
              </div>
            }
            fiatAmount={totalLocked}
          >
            <VirtualizedRows
              key="locked"
              rows={lockedSymbolBalances}
              locked
              // workaround bug in the virtualizer: first few rows arent always rendered here
              // there shouldnt be many locked row anyways
              overscan={lockedSymbolBalances.length}
            />
          </BalancesGroup>
        )}
      </div>
    </FadeIn>
  )
}

const VirtualizedRows: FC<{ rows: [string, Balances][]; locked?: boolean; overscan?: number }> = ({
  rows,
  locked,
  overscan,
}) => {
  const [noCountUp, setNoCountUp] = useState(false)
  const { ref: refContainer } = useScrollContainer()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timeout = setTimeout(() => {
      // we only want count up on the first rendering of the table
      // ex: sorting or filtering rows using search box should not trigger count up
      setNoCountUp(true)
    }, 500)

    return () => clearTimeout(timeout)
  }, [])

  const virtualizer = useVirtualizer({
    count: rows.length,
    overscan: overscan ?? 5,
    gap: 8,
    estimateSize: () => 56,
    getScrollElement: () => refContainer.current,
  })

  return (
    <div ref={ref}>
      <div
        className="relative w-full"
        style={{
          height: `${virtualizer.getTotalSize()}px`,
        }}
      >
        {virtualizer.getVirtualItems().map((item) => (
          <div
            key={item.key}
            className="absolute left-0 top-0 h-14 w-full"
            style={{
              transform: `translateY(${item.start}px)`,
            }}
          >
            {!!rows[item.index] && (
              <AssetRow balances={rows[item.index][1]} locked={locked} noCountUp={noCountUp} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
