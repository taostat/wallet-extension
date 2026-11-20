import { TokenId } from "@taostats-wallet/chaindata-provider"
import { isAddressEqual } from "@taostats-wallet/crypto"
import { Account } from "extension-core"

import { canAccountSellCrossChain } from "./crossChainSellGate"
import { CrossChainSellOpenOptions } from "./useCrossChainSellModal"

/** An account's TAO on Bittensor mainnet: the wallet's token for it and the transferable amount. */
export type TaoHolding = {
  address: string
  tokenId: TokenId
  /** Transferable TAO, in rao. */
  transferable: bigint
}

/**
 * The TAO sell the home screen's Swap menu opens: paid by the selected account when it can sell
 * (a local keypair, see `canAccountSellCrossChain`) and has transferable TAO, or with no account
 * selected, by the one of `holdings` that can sell and holds the most transferable TAO. Only TAO
 * is compared, never alpha (their amounts are in different units).
 *
 * `accounts` are the wallet's owned accounts. `null` when no account qualifies.
 */
export const pickTaoSellOpenOptions = ({
  holdings,
  accounts,
  selectedAddress,
}: {
  holdings: TaoHolding[]
  accounts: Account[]
  selectedAddress?: string | null
}): CrossChainSellOpenOptions | null => {
  const holding = holdings
    .filter(
      (h) =>
        h.transferable > 0n &&
        (!selectedAddress || isAddressEqual(selectedAddress, h.address)) &&
        canAccountSellCrossChain(accounts.find((a) => isAddressEqual(a.address, h.address))),
    )
    .sort((a, b) =>
      a.transferable > b.transferable ? -1 : a.transferable < b.transferable ? 1 : 0,
    )[0]

  return holding
    ? { address: holding.address, tokenId: holding.tokenId, asset: { kind: "tao" } }
    : null
}
