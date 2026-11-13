import { Balance, Balances } from "@taostats-wallet/balances"
import { isAddressEqual } from "@taostats-wallet/crypto"
import { useMemo } from "react"

import { usePortfolioNavigation } from "@ui/domains/Portfolio/usePortfolioNavigation"
import { useAccounts } from "@ui/state"

import { BITTENSOR_MAINNET_ID } from "./constants"
import { canAccountSellCrossChain, useIsCrossChainSellEnabled } from "./crossChainSellGate"
import { CrossChainSellOpenOptions } from "./useCrossChainSellModal"

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
 *
 * Returns what the sell opens with, or null when there is nothing to offer (no entry point shown).
 */
export const useCrossChainSellOpenOptions = (
  balances: Balances,
): CrossChainSellOpenOptions | null => {
  const isEnabled = useIsCrossChainSellEnabled()
  const { selectedAccount } = usePortfolioNavigation()
  const accounts = useAccounts("owned")

  return useMemo(() => {
    if (!isEnabled) return null
    const balance = balances.each
      .filter(
        (b) =>
          sellableAmount(b) > 0n &&
          (!selectedAccount || isAddressEqual(selectedAccount.address, b.address)) &&
          canAccountSellCrossChain(accounts.find((a) => isAddressEqual(a.address, b.address))),
      )
      .sort((a, b) => {
        const amountA = sellableAmount(a)
        const amountB = sellableAmount(b)
        return amountA > amountB ? -1 : amountA < amountB ? 1 : 0
      })[0]
    return balance ? toOpenOptions(balance) : null
  }, [accounts, balances, isEnabled, selectedAccount])
}
