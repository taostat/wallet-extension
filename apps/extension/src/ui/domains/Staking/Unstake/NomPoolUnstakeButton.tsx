import { TokenId } from "@taostats-wallet/chaindata-provider"
import { classNames } from "@taostats-wallet/util"
import { ZapOff } from "@untitledui/icons/ZapOff"
import { FC, useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"

import { useAnalytics } from "@ui/hooks/useAnalytics"

import { useNomPoolStakingStatus } from "../hooks/nomPools/useNomPoolStakingStatus"
import { useUnstakeModal } from "./useUnstakeModal"

// TODO: split into 2 components: one for bittensor and one for nompools
export const NomPoolUnstakeButton: FC<{
  tokenId: TokenId
  address: string
  className?: string
  variant: "small" | "large"
  poolId: number | undefined
}> = ({ tokenId, address, className, variant, poolId }) => {
  const { t } = useTranslation()
  const { open } = useUnstakeModal()
  const { data: stakingStatus } = useNomPoolStakingStatus(tokenId)

  const { genericEvent } = useAnalytics()

  const canUnstake = useMemo(
    () => !!stakingStatus?.accounts.find((s) => s.address === address && s.canUnstake),
    [address, stakingStatus?.accounts],
  )

  const handleClick = useCallback(() => {
    open({ tokenId, address, poolId })
    genericEvent("open inline unstaking modal", { from: "asset details", tokenId })
  }, [address, genericEvent, open, poolId, tokenId])

  if (!canUnstake) return null // no nompool/tao staking on this network

  return (
    <button
      className={classNames(
        "bg-fg-primary/10 hover:bg-fg-primary/20 text-fg-secondary hover:text-fg-primary font-light",
        variant === "small" && "h-5 rounded-sm px-1.5 text-xs",
        variant === "large" && "h-7 rounded px-2 text-sm",
        className,
      )}
      type="button"
      onClick={handleClick}
    >
      <div className="flex items-center gap-1">
        <ZapOff
          className={classNames(
            "shrink-0",
            variant === "small" && "text-xs",
            variant === "large" && "text-base",
          )}
        />
        <div>{t("Unstake")}</div>
      </div>
    </button>
  )
}
