import { Balances } from "@taostats-wallet/balances"
import { SubDTaoToken } from "@taostats-wallet/chaindata-provider"
import { isAddressEqual } from "@taostats-wallet/crypto"
import { Link2Icon } from "@taostats-wallet/icons"
import { FC, useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Tooltip, TooltipContent, TooltipTrigger } from "taostats-ui"

import { useBittensorStakeModal } from "@ui/domains/Staking/Bittensor/hooks/useBittensorStakeModal"
import { BittensorStakingWizardOpenOptions } from "@ui/domains/Staking/Bittensor/hooks/useBittensorStakeWizard"
import { useAccounts } from "@ui/state"
import { useBittensorNetworkIds } from "@ui/state/bittensor"

import { PortfolioToolbarButton } from "../PortfolioToolbarButton"

export const BittensorStakeToolbarButton: FC<{ balances: Balances; className?: string }> = ({
  balances,
  className,
}) => {
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

    return balance && token
      ? {
          networkId: token.networkId,
          stakeDirection: "bond",
        }
      : null
  }, [accounts, balances, bittensorNetworkIds])

  const handleClick = useCallback(() => {
    if (!openArgs) return
    open(openArgs)
  }, [open, openArgs])

  if (!openArgs) return null

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <PortfolioToolbarButton onClick={handleClick} className={className}>
          <Link2Icon className="-rotate-45" />
        </PortfolioToolbarButton>
      </TooltipTrigger>
      <TooltipContent>{t("Stake")}</TooltipContent>
    </Tooltip>
  )
}
