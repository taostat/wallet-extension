import { Balance, Balances } from "@taostats-wallet/balances"
import { isAddressEqual } from "@taostats-wallet/crypto"
import { classNames } from "@taostats-wallet/util"
import { CoinsSwap01 } from "@untitledui/icons/CoinsSwap01"
import { FC, MouseEvent, useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Tooltip, TooltipContent, TooltipTrigger } from "taostats-ui"

import { usePortfolioNavigation } from "@ui/domains/Portfolio/usePortfolioNavigation"
import { useAccounts } from "@ui/state"

import { BITTENSOR_MAINNET_ID } from "./constants"
import { canAccountSellCrossChain, useIsCrossChainSellEnabled } from "./crossChainSellGate"
import { CrossChainSellOpenOptions, useCrossChainSellModal } from "./useCrossChainSellModal"

/** What a balance offers to sell: available TAO, or an alpha position (netuid 1 and up, with its hotkey). */
const sellableAmount = (balance: Balance): bigint => {
  const token = balance.token
  if (!token || token.networkId !== BITTENSOR_MAINNET_ID) return 0n
  if (token.type === "substrate-native") return balance.transferable.planck
  if (token.type === "substrate-dtao" && token.netuid > 0 && token.hotkey)
    return balance.free.planck
  return 0n
}

const toOpenOptions = (balance: Balance): CrossChainSellOpenOptions | null => {
  const token = balance.token
  if (!token) return null
  if (token.type === "substrate-native")
    return { address: balance.address, tokenId: token.id, asset: { kind: "tao" } }
  if (token.type === "substrate-dtao" && token.hotkey)
    return {
      address: balance.address,
      tokenId: token.id,
      asset: { kind: "alpha", netuid: token.netuid, hotkey: token.hotkey },
    }
  return null
}

/**
 * "Sell for USDC or ETH" on an asset's token row: TAO, or one alpha position (a netuid and its
 * hotkey). It sells from the portfolio's selected account, or with all accounts shown, from the one
 * holding the most. Shown only with cross-chain sells on (build and our API) and an account that
 * can sign without a prompt (a local keypair).
 */
export const CrossChainSellButton: FC<{ balances: Balances; className?: string }> = ({
  balances,
  className,
}) => {
  const { t } = useTranslation()
  const isEnabled = useIsCrossChainSellEnabled()
  const { open } = useCrossChainSellModal()
  const { selectedAccount } = usePortfolioNavigation()
  const accounts = useAccounts("owned")

  const openOptions = useMemo(() => {
    if (!isEnabled) return null
    const balance = balances.each
      .filter(
        (b) =>
          sellableAmount(b) > 0n &&
          (!selectedAccount || isAddressEqual(selectedAccount.address, b.address)) &&
          canAccountSellCrossChain(accounts.find((a) => isAddressEqual(a.address, b.address))),
      )
      .sort((a, b) => (sellableAmount(a) > sellableAmount(b) ? -1 : 1))[0]
    return balance ? toOpenOptions(balance) : null
  }, [accounts, balances, isEnabled, selectedAccount])

  const handleClick = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation()
      if (openOptions) open(openOptions)
    },
    [open, openOptions],
  )

  if (!openOptions) return null

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={handleClick}
          aria-label={t("Sell for USDC or ETH")}
          className={classNames(
            "text-fg-secondary hover:text-fg-primary focus:text-fg-primary focus:bg-tertiary hover:bg-tertiary rounded-xs inline-flex h-[18px] w-[18px] items-center justify-center text-xs",
            className,
          )}
        >
          <CoinsSwap01 />
        </button>
      </TooltipTrigger>
      <TooltipContent>{t("Sell for USDC or ETH")}</TooltipContent>
    </Tooltip>
  )
}
