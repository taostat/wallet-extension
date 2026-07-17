import { Acknowledgement as BaseAcknowledgement } from "@ui/domains/Mnemonic/Acknowledgement"

import { Stages, useMnemonicBackupModal } from "./context"
import { MnemonicBackupModalBase } from "./MnemonicBackupModalBase"

export const Acknowledgement = () => {
  const { setStage } = useMnemonicBackupModal()

  return (
    <MnemonicBackupModalBase className="!w-[400px]">
      <BaseAcknowledgement
        onContinueClick={() => {
          setStage(Stages.Show)
        }}
      />
    </MnemonicBackupModalBase>
  )
}
