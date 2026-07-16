import { Balances } from "@taostats-wallet/balances"
import { classNames } from "@taostats-wallet/util"
import { FC, useCallback } from "react"
import { useTranslation } from "react-i18next"

import { AssetPrice, useDisplayAssetPrice } from "@ui/domains/Asset/AssetPrice"
import { Fiat } from "@ui/domains/Asset/Fiat"
import { TokenDisplaySymbol } from "@ui/domains/Asset/TokenDisplaySymbol"
import { useStakeButton } from "@ui/domains/Staking/Stake/hooks/useStakeButton"
import { StakePillButton } from "@ui/domains/Staking/Stake/StakePillButton"
import { useAnalytics } from "@ui/hooks/useAnalytics"
import { useBalancesStatus } from "@ui/hooks/useBalancesStatus"
import { useNavigateWithQuery } from "@ui/hooks/useNavigateWithQuery"
import { useUniswapV2LpTokenTotalValueLocked } from "@ui/hooks/useUniswapV2LpTokenTotalValueLocked"
import { useNetworkById } from "@ui/state"

import { TokenLogo } from "../../Asset/TokenLogo"
import { AssetBalanceCellValue } from "../AssetBalanceCellValue"
import { BittensorUnstakeButton } from "../AssetDetails/BittensorUnstakeButton"
import { useTokenBalancesSummary } from "../useTokenBalancesSummary"

export const AssetRow: FC<{ balances: Balances; noCountUp?: boolean }> = ({
  balances,
  noCountUp,
}) => {
  const { t } = useTranslation()
  const { genericEvent } = useAnalytics()

  const status = useBalancesStatus(balances)
  const { token, rate, summary } = useTokenBalancesSummary(balances)
  const displayPrice = useDisplayAssetPrice(token?.id, balances)
  const network = useNetworkById(token?.networkId)

  const navigate = useNavigateWithQuery()
  const handleClick = useCallback(() => {
    if (!token) return

    // Prefer using netuid for dTAO (substrate-dtao) tokens so we can distinguish subnets.
    if (token.type === "substrate-dtao") {
      const netuid = token.netuid
      navigate(`/portfolio/tokens/${netuid}`)
      genericEvent("goto portfolio asset", {
        from: "dashboard",
        symbol: token.symbol,
        netuid,
      })
      return
    }

    // Fallback: use symbol for non-dTAO tokens.
    navigate(`/portfolio/tokens/${encodeURIComponent(token.symbol)}`)
    genericEvent("goto portfolio asset", {
      from: "dashboard",
      symbol: token.symbol,
    })
  }, [genericEvent, navigate, token])

  const isUniswapV2LpToken = token?.type === "evm-uniswapv2"
  const tvl = useUniswapV2LpTokenTotalValueLocked(token, rate?.price, balances)

  const { canStake } = useStakeButton({ balances })

  if (!token || !network || !summary) return null

  return (
    <div className="group relative h-[66px] w-full">
      <button
        type="button"
        className={classNames(
          "text-fg-secondary hover:bg-secondary/50 border-primary grid h-[66px] w-full grid-cols-[40%_30%_30%] overflow-hidden border-b text-left text-base",
        )}
        onClick={handleClick}
      >
        <div className="flex h-full">
          <div className="flex shrink-0 items-center justify-center p-4 text-3xl">
            <TokenLogo tokenId={token.id} />
          </div>
          <div className="flex grow flex-col justify-center gap-1">
            <div className="flex items-center gap-1.5">
              <div className="text-fg-primary flex items-center gap-2 text-base font-bold">
                <TokenDisplaySymbol tokenId={token.id} />
                {!!network.isTestnet && (
                  <span className="text-tiny bg-orange-secondary/10 text-fg-orange rounded px-1.5 py-0.5 font-light">
                    {t("Testnet")}
                  </span>
                )}
              </div>
            </div>
            {isUniswapV2LpToken && typeof tvl === "number" && (
              <div className="text-fg-secondary whitespace-nowrap">
                <Fiat amount={tvl} noCountUp={noCountUp} /> <span className="text-tiny">TVL</span>
              </div>
            )}
            {!isUniswapV2LpToken && !!rate && (
              <AssetPrice
                tokenId={token.id}
                balances={balances}
                noChange
                tooltipLabel={t("Alpha Price")}
                className="text-fg-secondary text-xs"
              />
            )}
          </div>
        </div>
        <div className="h-[66px] text-right" />
        <div className="flex h-[66px] flex-col items-end justify-center gap-1 text-right">
          <AssetBalanceCellValue
            render
            tokens={summary.totalTokens}
            fiat={summary.totalFiat}
            symbol={isUniswapV2LpToken ? "" : token.symbol}
            change24hPct={displayPrice?.change24hValue ?? null}
            balancesStatus={status}
            className={classNames(
              canStake && "group-hover:hidden",
              status.status === "fetching" && "animate-pulse transition-opacity",
            )}
            noCountUp={noCountUp}
          />
        </div>
      </button>
      {canStake && (
        <div className="absolute right-4 top-0 hidden h-[66px] flex-col justify-center group-hover:flex">
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
