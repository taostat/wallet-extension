import { TokenId } from "@taostats-wallet/chaindata-provider"
import { Address } from "extension-core"
import { useCallback } from "react"

import { useGlobalOpenClose } from "@taostats/hooks/useGlobalOpenClose"

import { useResetNomPoolStakeWizard } from "./useStakeWizard"

export const useStakeModal = () => {
  const reset = useResetNomPoolStakeWizard()

  const { isOpen, open: innerOpen, close } = useGlobalOpenClose("NomPoolStakeModal")

  const open = useCallback(
    ({
      address,
      tokenId,
      poolId,
    }: {
      address: Address
      tokenId: TokenId
      poolId: number | string
    }) => {
      reset({
        address,
        tokenId,
        poolId,
        step: "form",
      })

      // then open the modal
      innerOpen()
    },
    [innerOpen, reset],
  )

  return { isOpen, open, close }
}
