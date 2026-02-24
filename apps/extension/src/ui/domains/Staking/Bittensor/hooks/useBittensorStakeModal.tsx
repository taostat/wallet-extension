import { log } from "extension-shared"
import { useCallback } from "react"

import { useGlobalOpenClose } from "@taostats/hooks/useGlobalOpenClose"

import type { BittensorStakingWizardOpenOptions } from "./useBittensorStakeWizard"
import { useResetBittensorStakeWizard } from "./useBittensorStakeWizard"

export const useBittensorStakeModal = () => {
  const reset = useResetBittensorStakeWizard()

  const { isOpen, open: innerOpen, close } = useGlobalOpenClose("BittensorStakeModal")

  const open = useCallback(
    (opts: BittensorStakingWizardOpenOptions) => {
      log.debug("[tao] Resetting Bittensor Stake Wizard", opts)
      reset(opts)
      innerOpen()
    },
    [innerOpen, reset],
  )

  return { isOpen, open, close }
}
