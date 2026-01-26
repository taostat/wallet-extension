import { GenericeResponseAddress, SubstrateAppParams } from "@zondax/ledger-substrate/dist/common"
import { LedgerPolkadotCurve } from "extension-core"
import { useCallback, useRef } from "react"

import { getPolkadotLedgerDerivationPath } from "@ui/hooks/ledger/common"
import { useLedgerPolkadot } from "@ui/hooks/ledger/useLedgerPolkadot"

export const useGetLedgerPolkadotAddress = (
  curve: LedgerPolkadotCurve,
  legacyApp?: SubstrateAppParams | null,
) => {
  const { getAddressEd25519 } = useLedgerPolkadot({ legacyApp })

  // derivation path => address cache, usefull when going back to previous page
  const refAddressCache = useRef<Record<string, Promise<GenericeResponseAddress>>>({})

  const getAddress = useCallback(
    async (accountIndex: number, addressOffset: number) => {
      const derivationPath = getPolkadotLedgerDerivationPath({
        accountIndex,
        addressOffset,
        legacyApp,
      })
      const prefix = legacyApp?.ss58_addr_type ?? 42
      const cacheKey = `${curve}::${prefix}::${derivationPath}`

      if (!refAddressCache.current[cacheKey]) {
        switch (curve) {
          case "ed25519":
            refAddressCache.current[cacheKey] = getAddressEd25519(derivationPath, prefix)
            break
          default:
            throw new Error("Unsupported curve in getAddress")
        }
      }

      const result = await refAddressCache.current[cacheKey]

      switch (curve) {
        case "ed25519":
          return result.address
        default:
          throw new Error("Unsupported curve in getAddress")
      }
    },
    [curve, getAddressEd25519, legacyApp],
  )

  return { getAddress }
}
