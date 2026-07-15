import { TokenId } from "@taostats-wallet/chaindata-provider"
import { classNames } from "@taostats-wallet/util"
import { FC } from "react"
import { useTranslation } from "react-i18next"

import { useSelectedCurrency } from "@ui/state"

import { TokensAndFiat } from "../../Asset/TokensAndFiat"

export const StakingFeeEstimate: FC<{
  isLoading?: boolean
  error?: unknown
  plancks: bigint | null | undefined
  tokenId: TokenId | null | undefined
  noCountUp?: boolean
  noFiat?: boolean
  className?: string
  tokensClassName?: string
}> = ({ error, isLoading, plancks, tokenId, noCountUp, noFiat, className, tokensClassName }) => {
  const { t } = useTranslation()
  const selectedCurrency = useSelectedCurrency()
  // When display currency is TAO, hide fiat to avoid showing TAO twice (e.g. "0.01 TAO (0.01 TAO)")
  const hideFiat = noFiat || selectedCurrency === "tao"
  return (
    <>
      {error ? (
        <div className={classNames("text-fg-error truncate", className)}>
          {t("Failed to estimate fee")}
        </div>
      ) : (plancks || plancks === 0n) && tokenId ? (
        <TokensAndFiat
          tokenId={tokenId}
          planck={plancks}
          tokensClassName={classNames("text-fg-primary", tokensClassName)}
          fiatClassName="text-fg-secondary"
          noCountUp={noCountUp}
          noFiat={hideFiat}
          className={classNames(isLoading && "animate-pulse", className)}
        />
      ) : isLoading ? (
        <div
          className={classNames("text-fg-disabled bg-disabled rounded-xs animate-pulse", className)}
        >
          0.0000 TKN ($0.00)
        </div>
      ) : null}
    </>
  )
}
