import { Balances } from "@taostats-wallet/balances"
import { TokenId } from "@taostats-wallet/chaindata-provider"
import { ChevronLeftIcon } from "@taostats-wallet/icons"
import { isTruthy } from "@taostats-wallet/util"
import { uniq } from "lodash-es"
import { useCallback, useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Navigate, useNavigate, useParams } from "react-router-dom"
import { IconButton } from "taostats-ui"

import { AssetPriceChart } from "@ui/domains/Asset/AssetPriceChart"
import { Fiat } from "@ui/domains/Asset/Fiat"
import { PopupAssetDetails } from "@ui/domains/Portfolio/AssetDetails"
import { useDisplayBalances } from "@ui/domains/Portfolio/useDisplayBalances"
import { usePortfolioNavigation } from "@ui/domains/Portfolio/usePortfolioNavigation"
import { useAnalytics } from "@ui/hooks/useAnalytics"
import { useBalances, usePortfolioBalances, useSelectedCurrency } from "@ui/state"

const PageContent = ({
  balances,
  symbol,
  name,
}: {
  balances: Balances
  symbol: string
  name: string
}) => {
  const navigate = useNavigate()
  const balancesToDisplay = useDisplayBalances(balances)
  const currency = useSelectedCurrency()

  const handleBackBtnClick = useCallback(() => navigate(-1), [navigate])

  const total = useMemo(
    () => balancesToDisplay.sum.fiat(currency).total,
    [balancesToDisplay.sum, currency],
  )

  const tokenIds = useMemo<TokenId[]>(
    () => uniq(balancesToDisplay.each.map((b) => b.token?.id).filter(isTruthy)),
    [balancesToDisplay],
  )

  const { t } = useTranslation()

  return (
    <>
      <div className="text-body flex h-[3.6rem] w-full items-center gap-4 text-base font-bold">
        <IconButton onClick={handleBackBtnClick}>
          <ChevronLeftIcon />
        </IconButton>
        <div className="shrink-0">{name}</div>
        <div className="flex grow items-center justify-end gap-3">
          <div className="text-body-secondary text-sm">{t("Total")}</div>
          <Fiat amount={total} isBalance />
        </div>
      </div>

      <div className="py-4">
        <AssetPriceChart tokenIds={tokenIds} variant="small" className="mb-8" />
        <PopupAssetDetails balances={balancesToDisplay} symbol={symbol} />
      </div>
    </>
  )
}

export const PortfolioAsset = () => {
  const { netuid: assetId } = useParams()
  const { selectedAccount: account } = usePortfolioNavigation()
  const allBalances = useBalances()
  const { networkBalances } = usePortfolioBalances()
  const { popupOpenEvent } = useAnalytics()

  const accountBalances = useMemo(
    () => (account ? allBalances.find((b) => b.address === account.address) : networkBalances),
    [account, allBalances, networkBalances],
  )

  const balances = useMemo(() => {
    if (!assetId) return undefined

    const parsed = Number(assetId)

    // If the URL param parses as a number, prefer matching by netuid (for dTAO / Bittensor assets).
    if (!Number.isNaN(parsed)) {
      return accountBalances.find(
        (b) => b.token?.type === "substrate-dtao" && b.token.netuid === parsed,
      )
    }

    // Fallback: match by symbol for non-dTAO tokens or legacy URLs.
    return accountBalances.find((b) => b.token?.symbol === assetId)
  }, [accountBalances, assetId])

  // Derive a representative token from the balances set (e.g. first token).
  const firstToken = balances?.each[0]?.token
  const displaySymbol = firstToken?.symbol ?? assetId ?? ""
  const displayName = firstToken?.name === "SN0 | Root" ? "TAO" : (firstToken?.name ?? "")

  useEffect(() => {
    popupOpenEvent("portfolio asset", {
      assetId,
      symbol: firstToken?.symbol,
      ...(firstToken?.type === "substrate-dtao" ? { netuid: firstToken.netuid } : {}),
    })
  }, [assetId, firstToken, popupOpenEvent])

  if (!assetId || !balances) return <Navigate to="/portfolio" />

  return <PageContent balances={balances} symbol={displaySymbol} name={displayName} />
}
