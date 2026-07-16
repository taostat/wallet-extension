import { TokenId } from "@taostats-wallet/chaindata-provider"
import { Copy01 } from "@untitledui/icons/Copy01"
import { LinkExternal01 } from "@untitledui/icons/LinkExternal01"
import { FC, useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Tooltip, TooltipContent, TooltipTrigger } from "taostats-ui"

import { shortenAddress } from "@taostats/util/shortenAddress"
import { AccountIcon } from "@ui/domains/Account/AccountIcon"
import { TokenLogo } from "@ui/domains/Asset/TokenLogo"
import { TokensAndFiat } from "@ui/domains/Asset/TokensAndFiat"
import { useIsKnownAddress } from "@ui/hooks/useIsKnownAddress"
import { copyAddress } from "@ui/util/copyAddress"

const FormattedAddress = ({ address }: { address: string }) => {
  const isKnown = useIsKnownAddress(address)

  const label = useMemo(
    () => (isKnown && isKnown.value.name) ?? shortenAddress(address),
    [address, isKnown],
  )

  return (
    <Tooltip>
      <TooltipTrigger className="flex max-w-[200px] items-center gap-1">
        <AccountIcon address={address} className="text-[1.2em]" />
        <span className="overflow-hidden text-ellipsis whitespace-nowrap">{label}</span>
      </TooltipTrigger>
      <TooltipContent>{address}</TooltipContent>
    </Tooltip>
  )
}

export const SignViewVotingDelegate: FC<{
  amount: bigint
  tokenId: TokenId
  representative: string
  conviction: number
  trackId: number
  explorerUrl?: string | null
}> = ({ amount, tokenId, representative, conviction, trackId, explorerUrl }) => {
  const { t } = useTranslation()
  const url = useMemo(
    () => (explorerUrl && representative ? `${explorerUrl}/address/${representative}` : undefined),
    [representative, explorerUrl],
  )

  const handleClick = useCallback(() => {
    if (url) window.open(url, "_blank")
    else if (representative) copyAddress(representative)
  }, [representative, url])

  return (
    <div className="flex w-full flex-col items-center gap-2">
      <div className="flex w-full items-center justify-between gap-4 overflow-hidden">
        <div className="whitespace-nowrap">{t("Delegating to")}</div>
        <div className="text-fg-primary flex grow justify-end gap-1 overflow-hidden text-base">
          <FormattedAddress address={representative} />
          <button
            type="button"
            className="text-fg-secondary hover:text-fg-primary shrink-0"
            onClick={handleClick}
          >
            {url ? (
              <LinkExternal01 className="transition-none" />
            ) : (
              <Copy01 className="transition-none" />
            )}
          </button>
        </div>
      </div>
      <div className="flex w-full items-center justify-between">
        <div>{t("Amount")}</div>
        <div className="text-fg-primary">
          <TokenLogo tokenId={tokenId} className="inline h-[1em] w-[1em]" />{" "}
          <TokensAndFiat planck={amount} tokenId={tokenId} noCountUp />
        </div>
      </div>
      <div className="flex w-full items-center justify-between">
        <div>{t("Conviction")}</div>
        <div className="text-fg-primary">{conviction === 0 ? "0.1" : conviction}X</div>
      </div>
      <div className="flex w-full items-center justify-between">
        <div>{t("Track")}</div>
        <div className="text-fg-primary">#{trackId}</div>
      </div>
    </div>
  )
}
