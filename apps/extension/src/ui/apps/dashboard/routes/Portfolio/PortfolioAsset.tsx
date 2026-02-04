import { Balances } from "@taostats-wallet/balances"
import { Token, TokenId } from "@taostats-wallet/chaindata-provider"
import { SendIcon } from "@taostats-wallet/icons"
import { t } from "i18next"
import { uniq } from "lodash-es"
import { FC, useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"
import { Tooltip, TooltipContent, TooltipTrigger } from "taostats-ui"

import { Breadcrumb } from "@taostats/components/Breadcrumb"
import { NavigateWithQuery } from "@taostats/components/NavigateWithQuery"
import { AssetPriceChart } from "@ui/domains/Asset/AssetPriceChart"
import { DashboardAssetDetails } from "@ui/domains/Portfolio/AssetDetails"
// import { BittensorClaimSettingsToolbarButton } from "@ui/domains/Portfolio/AssetDetails/BittensorClaimSettingsToolbarButton"
import { BittensorStakeToolbarButton } from "@ui/domains/Portfolio/AssetDetails/BittensorStakeToolbarButton"
import { BittensorUnstakeToolbarButton } from "@ui/domains/Portfolio/AssetDetails/BittensorUnstakeToolbarButton"
import { DashboardPortfolioHeader } from "@ui/domains/Portfolio/DashboardPortfolioHeader"
import { PortfolioToolbarButton } from "@ui/domains/Portfolio/PortfolioToolbarButton"
import { Statistics } from "@ui/domains/Portfolio/Statistics"
import { useDisplayBalances } from "@ui/domains/Portfolio/useDisplayBalances"
import { usePortfolioNavigation } from "@ui/domains/Portfolio/usePortfolioNavigation"
import {
  BalanceSummary,
  useTokenBalancesSummary,
} from "@ui/domains/Portfolio/useTokenBalancesSummary"
import { useAnalytics } from "@ui/hooks/useAnalytics"
import { useNavigateWithQuery } from "@ui/hooks/useNavigateWithQuery"
import { useSendFundsPopup } from "@ui/hooks/useSendFundsPopup"
import { usePortfolioBalances } from "@ui/state"

const HeaderRow: FC<{
  token: Token | undefined
  summary: BalanceSummary
}> = ({ token, summary }) => {
  const { t } = useTranslation()
  const canHaveLockedState = Boolean(token?.networkId)

  if (summary.totalTokens.isZero()) return null

  return (
    <div className="text-body-secondary bg-grey-850 rounded p-8 text-left text-base">
      <div className="grid grid-cols-[40%_30%_30%]">
        <Statistics
          className="h-auto w-auto p-0"
          title={t("Total Value")}
          tokens={summary.totalTokens}
          fiat={summary.totalFiat}
          token={token}
          showTokens
          align="left"
        />
        {canHaveLockedState ? (
          <>
            <Statistics
              className="h-auto w-auto items-end p-0 pr-8"
              title={t("Locked")}
              tokens={summary.lockedTokens}
              fiat={summary.lockedFiat}
              token={token}
              locked
              showTokens
              align="right"
            />
            <Statistics
              className="h-auto w-auto items-end p-0"
              title={t("Available")}
              tokens={summary.availableTokens}
              fiat={summary.availableFiat}
              token={token}
              showTokens
              align="right"
            />
          </>
        ) : (
          <>
            <div />
            <div />
          </>
        )}
      </div>
    </div>
  )
}

const SendFundsButton: FC<{ symbol: string }> = ({ symbol }) => {
  const { selectedAccount: account } = usePortfolioNavigation()

  // don't set the token id here because it could be one of many
  const { canSendFunds, cannotSendFundsReason, openSendFundsPopup } = useSendFundsPopup(
    account,
    undefined,
    symbol,
  )

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <PortfolioToolbarButton onClick={openSendFundsPopup} disabled={!canSendFunds}>
          <SendIcon />
        </PortfolioToolbarButton>
      </TooltipTrigger>
      <TooltipContent>
        {canSendFunds ? t("Send {{symbol}}", { symbol }) : cannotSendFundsReason}
      </TooltipContent>
    </Tooltip>
  )
}

const TokenBreadcrumb: FC<{
  name: string
  symbol?: string
  balances: Balances
}> = ({ name, symbol, balances }) => {
  const { t } = useTranslation()

  const navigate = useNavigateWithQuery()

  const items = useMemo(() => {
    return [
      {
        label: t("All Tokens"),
        onClick: () => navigate("/portfolio/tokens"),
      },
      {
        label: <div className="text-body font-bold">{name}</div>,
        onClick: undefined,
      },
    ]
  }, [t, name, navigate])

  return (
    <div className="flex h-20 items-center justify-between">
      <div className="grow">
        <Breadcrumb items={items} />
      </div>
      <div className="flex h-20 items-center gap-2">
        {/* <BittensorClaimSettingsToolbarButton balances={balances} /> */}
        <BittensorStakeToolbarButton balances={balances} />
        <BittensorUnstakeToolbarButton balances={balances} />
        {symbol && <SendFundsButton symbol={symbol} />}
      </div>
    </div>
  )
}

const usePortfolioAsset = () => {
  const { netuid: assetId } = useParams()
  const { allBalances } = usePortfolioBalances()

  const balances = useMemo(() => {
    if (!assetId) return new Balances([])

    const parsed = Number(assetId)

    // If the URL param parses as a number, prefer matching by netuid (for dTAO / Bittensor assets).
    if (!Number.isNaN(parsed)) {
      const match = allBalances.find(
        (b) => b.token?.type === "substrate-dtao" && b.token.netuid === parsed,
      )
      return match ?? new Balances([])
    }

    // Fallback: match by symbol for non-dTAO tokens or legacy URLs.
    const match = allBalances.find((b) => b.token?.symbol === assetId)
    return match ?? new Balances([])
  }, [allBalances, assetId])

  const { token, rate, summary } = useTokenBalancesSummary(balances)
  const balancesToDisplay = useDisplayBalances(balances)

  return { assetId, token, rate, balances, balancesToDisplay, summary }
}

export const PortfolioAsset = () => {
  const { assetId, token, balancesToDisplay, summary } = usePortfolioAsset()
  const { pageOpenEvent } = useAnalytics()

  useEffect(() => {
    pageOpenEvent("portfolio asset", {
      assetId,
      symbol: token?.symbol,
      ...(token?.type === "substrate-dtao" ? { netuid: token.netuid } : {}),
    })
  }, [assetId, pageOpenEvent, token])

  if (!assetId || !balancesToDisplay) return <NavigateWithQuery url="/portfolio" />

  return (
    <>
      <TokenBreadcrumb
        name={token?.name || token?.symbol || assetId}
        symbol={token?.symbol}
        balances={balancesToDisplay}
      />
      <HeaderRow token={token} summary={summary} />
      <DashboardAssetDetails balances={balancesToDisplay} symbol={token?.symbol || assetId} />
    </>
  )
}

export const PortfolioAssetHeader = () => {
  const { balances } = usePortfolioAsset()

  // all tokenIds that match the symbol and have a coingeckoId
  const tokenIds = useMemo(() => {
    if (!balances) return [] as TokenId[]
    return uniq(balances.each.filter((b) => !!b.token?.coingeckoId).map((b) => b.token?.id)).filter(
      Boolean,
    ) as TokenId[]
  }, [balances])

  // no chart to display, use default header
  if (!tokenIds.length) return <DashboardPortfolioHeader />

  return <AssetPriceChart tokenIds={tokenIds} variant="large" />
}
