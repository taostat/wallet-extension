import { HexString } from "@polkadot/util/types"
import { createExtensionSubstrateSigner } from "@taostats-wallet/cross-chain"
import { Account, isAccountAddressSs58, isAccountOfType } from "extension-core"
import { log } from "extension-shared"
import { useMemo } from "react"

import { api } from "@ui/api"
import { useScaleApi } from "@ui/hooks/sapi/useScaleApi"

export type CrossChainSigner = ReturnType<typeof createExtensionSubstrateSigner>

/**
 * The swap SDK's `SubstrateSigner` for `account` on Bittensor (`genesisHash`): sapi builds each
 * batch here, and the service worker signs it (`api.subSign`) and submits it
 * (`api.subSubmitAndWatch`).
 *
 * `null` while sapi loads, and for any account that can't sign without a prompt: only local keypair
 * accounts with an SS58 address can (no Ledger, Vault, Signet or watched account).
 */
export const useCrossChainSigner = (
  account: Account | null | undefined,
  genesisHash: HexString | null | undefined,
): CrossChainSigner | null => {
  const { data: sapi } = useScaleApi(genesisHash)

  return useMemo(() => {
    if (!sapi || !isAccountOfType(account, "keypair") || !isAccountAddressSs58(account)) return null
    try {
      return createExtensionSubstrateSigner({ address: account.address, sapi, api })
    } catch (error) {
      log.error("[cross-chain] Can't create the signer", { error, address: account.address })
      return null
    }
  }, [account, sapi])
}
