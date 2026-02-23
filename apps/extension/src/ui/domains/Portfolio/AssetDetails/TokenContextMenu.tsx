import { TokenId } from "@taostats-wallet/chaindata-provider"
import { MoreHorizontalIcon } from "@taostats-wallet/icons"
import { classNames } from "@taostats-wallet/util"
import React, { FC, forwardRef, Suspense, useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  PopoverOptions,
} from "taostats-ui"

import { SuspenseTracker } from "@taostats/components/SuspenseTracker"
import { api } from "@ui/api"
import { useStakeModal } from "@ui/domains/Staking/Stake/hooks/useStakeModal"
import { useNomPoolStakingStatus } from "@ui/domains/Staking/hooks/nomPools/useNomPoolStakingStatus"
import { useAnalytics } from "@ui/hooks/useAnalytics"

const ViewTokenDetailsMenuItem: FC<{ tokenId: TokenId }> = ({ tokenId }) => {
  const { t } = useTranslation()
  const { genericEvent } = useAnalytics()

  const handleClick = useCallback(() => {
    api.dashboardOpen(`/settings/networks-tokens/tokens/${tokenId}`)
    genericEvent("open view token details", { from: "token menu" })
  }, [genericEvent, tokenId])

  return <ContextMenuItem onClick={handleClick}>{t("View token details")}</ContextMenuItem>
}

const StakeMenuItem: FC<{ tokenId: string }> = ({ tokenId }) => {
  const { t } = useTranslation()
  const { genericEvent } = useAnalytics()

  const { open } = useStakeModal()
  const { data: stakingStatus } = useNomPoolStakingStatus(tokenId)

  const openArgs = useMemo<Parameters<typeof open>[0] | undefined>(() => {
    if (!stakingStatus) return
    const { accounts, poolId } = stakingStatus
    const acc = accounts?.find((s) => s.canBondNomPool)
    if (!acc) return
    return {
      tokenId,
      address: acc.address,
      poolId: acc.poolId ?? poolId,
    }
  }, [stakingStatus, tokenId])

  const handleClick = useCallback(() => {
    if (!openArgs) return
    open(openArgs)
    genericEvent("open inline staking modal", { tokenId: openArgs.tokenId })
  }, [genericEvent, open, openArgs])

  if (!openArgs) return null

  return <ContextMenuItem onClick={handleClick}>{t("Stake")}</ContextMenuItem>
}

type Props = {
  tokenId: TokenId
  placement?: PopoverOptions["placement"]
  trigger?: React.ReactNode
  className?: string
}

export const TokenContextMenu = forwardRef<HTMLElement, Props>(function AccountContextMenu(
  { tokenId, placement, trigger, className },
  ref,
) {
  return (
    <ContextMenu placement={placement ?? "bottom-end"}>
      <ContextMenuTrigger
        ref={ref}
        className={classNames(
          "hover:bg-grey-800 text-body-secondary hover:text-body rounded p-6",
          className,
        )}
        asChild={!!trigger}
      >
        {trigger ? trigger : <MoreHorizontalIcon className="shrink-0" />}
      </ContextMenuTrigger>
      <ContextMenuContent className="border-grey-800 z-50 flex w-min flex-col whitespace-nowrap rounded-sm border bg-black px-2 py-3 text-left text-sm shadow-lg">
        <Suspense fallback={<SuspenseTracker name="TokenContextMenu.Stake" />}>
          <StakeMenuItem tokenId={tokenId} />
        </Suspense>
        <ViewTokenDetailsMenuItem tokenId={tokenId} />
      </ContextMenuContent>
    </ContextMenu>
  )
})
