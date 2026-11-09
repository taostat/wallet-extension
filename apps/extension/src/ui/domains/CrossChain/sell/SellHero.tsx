import { formatRawAmount, rawToNumber, sellOutputDecimals } from "@taostats-wallet/cross-chain"
import { cn } from "@taostats-wallet/util"
import { ArrowDown } from "@untitledui/icons/ArrowDown"
import { FC } from "react"
import { useTranslation } from "react-i18next"

import { Fiat } from "@ui/domains/Asset/Fiat"
import { TokenLogo } from "@ui/domains/Asset/TokenLogo"
import { Tokens } from "@ui/domains/Asset/Tokens"

import { useCrossChainSell } from "./useCrossChainSell"

/** What is sold, as the screens name it: `TAO`, or the subnet's alpha by its token. */
export const useSellAsset = () => {
  const { input, assetToken } = useCrossChainSell()
  const symbol =
    input?.kind === "alpha"
      ? assetToken?.symbol || `SN${input.netuid}`
      : (assetToken?.symbol ?? "TAO")
  const name = input?.kind === "alpha" ? (assetToken?.name ?? `SN${input.netuid}`) : "TAO"
  return { symbol, name, tokenId: assetToken?.id }
}

/**
 * What is paid and what arrives, at the top of the review and the progress: each side's amount,
 * token and network, and its USD value when the quote priced it. The website's review hero.
 */
export const SellHero: FC<{
  payRaw: bigint
  receiveRaw: bigint
  payUsd: number | undefined
  receiveUsd: number | undefined
  /** The receive side is being re-priced. */
  isRefreshing?: boolean
}> = ({ payRaw, receiveRaw, payUsd, receiveUsd, isRefreshing }) => {
  const { t } = useTranslation()
  const { output } = useCrossChainSell()
  const asset = useSellAsset()

  return (
    <div className="bg-secondary relative rounded">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="text-fg-secondary text-xs uppercase">{t("You pay")}</div>
          <Tokens
            amount={formatRawAmount(payRaw, 9)}
            symbol={asset.symbol}
            noCountUp
            className="text-fg-primary truncate text-lg"
          />
          <div className="text-fg-secondary flex gap-1 text-xs">
            {payUsd !== undefined ? (
              <>
                <Fiat amount={payUsd} forceCurrency="usd" noCountUp />
                <span>·</span>
              </>
            ) : null}
            <span className="truncate">{t("on {{network}}", { network: "Bittensor" })}</span>
          </div>
        </div>
        <TokenLogo tokenId={asset.tokenId} className="shrink-0 text-[32px]" />
      </div>
      <div className="border-primary relative border-t">
        <span className="bg-tertiary border-primary absolute left-1/2 top-0 flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-sm border">
          <ArrowDown className="text-fg-secondary size-4" aria-hidden />
        </span>
      </div>
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="text-fg-secondary text-xs uppercase">{t("You receive")}</div>
          <Tokens
            amount={rawToNumber(receiveRaw, sellOutputDecimals(output))}
            symbol={output}
            noCountUp
            className={cn(
              "text-fg-primary truncate text-lg transition-opacity",
              isRefreshing && "opacity-50",
            )}
          />
          <div className="text-fg-secondary flex gap-1 text-xs">
            {receiveUsd !== undefined ? (
              <>
                <Fiat amount={receiveUsd} forceCurrency="usd" noCountUp />
                <span>·</span>
              </>
            ) : null}
            <span className="truncate">{t("on {{network}}", { network: "Ethereum" })}</span>
          </div>
        </div>
        <OutputLogo output={output} />
      </div>
    </div>
  )
}

/** USDC or ETH, as a letter mark: neither is a wallet token here. */
export const OutputLogo: FC<{ output: "USDC" | "ETH"; className?: string }> = ({
  output,
  className,
}) => (
  <span
    aria-hidden
    className={cn(
      "flex size-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white",
      output === "USDC" ? "bg-[#2775CA]" : "bg-[#627EEA]",
      className,
    )}
  >
    {output}
  </span>
)
