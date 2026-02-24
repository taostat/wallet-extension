import { TokenId } from "@taostats-wallet/chaindata-provider"
import { Address } from "extension-core"
import { useCallback } from "react"

import { useGlobalOpenClose } from "@taostats/hooks/useGlobalOpenClose"

import { useResetNomPoolUnstakeWizard } from "./useUnstakeWizard"

export const useUnstakeModal = () => {
  const reset = useResetNomPoolUnstakeWizard()

  const { isOpen, open: innerOpen, close } = useGlobalOpenClose("UnstakeModal")

  const open = useCallback(
    ({
      address,
      tokenId,
      poolId,
    }: {
      address: Address
      tokenId: TokenId
      poolId: string | number | undefined
    }) => {
      reset({ address, tokenId, poolId })

      // then open the modal
      innerOpen()
    },
    [innerOpen, reset],
  )

  return { isOpen, open, close }
}
