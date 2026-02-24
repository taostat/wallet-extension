import { Balances } from "@taostats-wallet/balances"
import { SubDTaoToken } from "@taostats-wallet/chaindata-provider"
import { isAddressEqual } from "@taostats-wallet/crypto"
import { DatabaseIcon } from "@taostats-wallet/icons"
import { classNames } from "@taostats-wallet/util"
import { FC, useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Tooltip, TooltipContent, TooltipTrigger } from "taostats-ui"

import { useBittensorStakeModal } from "@ui/domains/Staking/Bittensor/hooks/useBittensorStakeModal"
import { BittensorStakingWizardOpenOptions } from "@ui/domains/Staking/Bittensor/hooks/useBittensorStakeWizard"
import { useAccounts } from "@ui/state"
import { useBittensorNetworkIds } from "@ui/state/bittensor"

const pillButtonClass =
  "bg-[#293c37] hover:bg-[#214940] text-primary rounded-sm p-4 text-xs font-light"

export const BittensorUnstakeButton: FC<{
  balances: Balances
  className?: string
  variant?: "icon" | "pill"
}> = ({ balances, className, variant = "icon" }) => {
  const { t } = useTranslation()
  const { open } = useBittensorStakeModal()
  const bittensorNetworkIds = useBittensorNetworkIds()
  const accounts = useAccounts("owned")

  const openArgs = useMemo<BittensorStakingWizardOpenOptions | null>(() => {
    const balance = balances.each
      .filter(
        (b) =>
          b.token?.type === "substrate-dtao" &&
          bittensorNetworkIds.includes(b.token.networkId) &&
          accounts.some((a) => isAddressEqual(a.address, b.address)),
      )
      .sort((a, b) => (a.free.planck > b.free.planck ? -1 : 1))[0]

    const token = balance?.token as SubDTaoToken

    const hasFreeBalance = !!balance?.free?.planck

    return balance && token && hasFreeBalance
      ? {
          networkId: token.networkId,
          address: balance.address,
          netuid: token.netuid,
          hotkey: token.hotkey,
          stakeDirection: "unstake",
        }
      : null
  }, [accounts, balances, bittensorNetworkIds])

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!openArgs) return
      if (variant === "pill") e.stopPropagation()
      open(openArgs)
    },
    [open, openArgs, variant],
  )

  if (!openArgs) return null

  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={classNames(pillButtonClass, className)}
      >
        <div className="flex items-center gap-2">
          <DatabaseIcon className="shrink-0 text-base" />
          <div>{t("Unstake")}</div>
        </div>
      </button>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={handleClick}
          className={classNames(
            "text-body-secondary hover:text-body focus:text-body focus:bg-grey-700 hover:bg-grey-700 rounded-xs inline-flex h-9 w-9 items-center justify-center text-xs",
            className,
          )}
        >
          <DatabaseIcon />
        </button>
      </TooltipTrigger>
      <TooltipContent>{t("Unstake")}</TooltipContent>
    </Tooltip>
  )
}
