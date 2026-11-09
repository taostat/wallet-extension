import { Acknowledgement as BaseAcknowledgement } from "@ui/domains/Mnemonic/Acknowledgement"

import { Stages, useMnemonicCreateModal } from "./context"
import { MnemonicCreateModalDialog } from "./Dialog"

export const Acknowledgement = () => {
  const { setStage } = useMnemonicCreateModal()
  return (
    <MnemonicCreateModalDialog className="!w-[400px]">
      <BaseAcknowledgement onContinueClick={() => setStage(Stages.Create)} />
    </MnemonicCreateModalDialog>
  )
}
