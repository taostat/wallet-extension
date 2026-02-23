import { Balances } from "@taostats-wallet/balances"
import { classNames } from "@taostats-wallet/util"
import { FC, useCallback } from "react"
import { useTranslation } from "react-i18next"

import { AssetPrice } from "@ui/domains/Asset/AssetPrice"
import { Fiat } from "@ui/domains/Asset/Fiat"
import { TokenDisplaySymbol } from "@ui/domains/Asset/TokenDisplaySymbol"
import { StakePillButton } from "@ui/domains/Staking/Stake/StakePillButton"
import { useStakeButton } from "@ui/domains/Staking/Stake/hooks/useStakeButton"
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
    <div className="group relative h-[6.6rem] w-full">
      <button
        type="button"
        className={classNames(
          "text-body-secondary bg-grey-850 hover:bg-grey-800 grid h-[6.6rem] w-full grid-cols-[40%_30%_30%] overflow-hidden rounded text-left text-base",
        )}
        onClick={handleClick}
      >
        <div className="flex h-full">
          <div className="shrink-0 p-8 text-xl">
            <TokenLogo tokenId={token.id} />
          </div>
          <div className="flex grow flex-col justify-center gap-2">
            <div className="flex items-center gap-3">
              <div className="text-body flex items-center gap-4 text-base font-bold">
                <TokenDisplaySymbol tokenId={token.id} />
                {!!network.isTestnet && (
                  <span className="text-tiny bg-alert-warn/10 text-alert-warn rounded px-3 py-1 font-light">
                    {t("Testnet")}
                  </span>
                )}
              </div>
            </div>
            {isUniswapV2LpToken && typeof tvl === "number" && (
              <div className="text-body-secondary whitespace-nowrap">
                <Fiat amount={tvl} noCountUp={noCountUp} /> <span className="text-tiny">TVL</span>
              </div>
            )}
            {!isUniswapV2LpToken && !!rate && (
              <AssetPrice tokenId={token.id} className="text-body-secondary" balances={balances} />
            )}
          </div>
        </div>
        <div className="h-[6.6rem] text-right">
          {/* <AssetBalanceCellValue
            locked
            render={summary.lockedTokens.gt(0)}
            tokens={summary.lockedTokens}
            fiat={summary.lockedFiat}
            symbol={isUniswapV2LpToken ? "" : token.symbol}
            balancesStatus={status}
            className={classNames(
              "noPadRight",
              status.status === "fetching" && "animate-pulse transition-opacity",
            )}
            noCountUp={noCountUp}
          /> */}
        </div>
        {/* <div className="flex h-[6.6rem] flex-col items-end justify-center gap-2 text-right">
          <AssetBalanceCellValue
            render
            tokens={summary.availableTokens}
            fiat={summary.availableFiat}
            symbol={isUniswapV2LpToken ? "" : token.symbol}
            balancesStatus={status}
            className={classNames(
              canStake && "group-hover:hidden",
              status.status === "fetching" && "animate-pulse transition-opacity",
            )}
            noCountUp={noCountUp}
          />
        </div> */}
        <div className="flex h-[6.6rem] flex-col items-end justify-center gap-2 text-right">
          <AssetBalanceCellValue
            render
            tokens={summary.totalTokens}
            fiat={summary.totalFiat}
            symbol={isUniswapV2LpToken ? "" : token.symbol}
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
        <div className="absolute right-8 top-0 hidden h-[6.6rem] flex-col justify-center group-hover:flex">
          <div className="flex items-center gap-3">
            <StakePillButton
              balances={balances}
              isPortfolio
              className="[>svg]:text-[2rem] text-sm"
            />
            <BittensorUnstakeButton
              balances={balances}
              variant="pill"
              className="[>svg]:text-[2rem] text-sm"
            />
          </div>
        </div>
      )}
    </div>
  )
}
