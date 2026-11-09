import { VerificationComplete } from "@ui/domains/Mnemonic/VerificationComplete"

import { useMnemonicBackupModal } from "./context"
import { MnemonicBackupModalBase } from "./MnemonicBackupModalBase"

export const Complete = () => {
  const { close } = useMnemonicBackupModal()

  return (
    <MnemonicBackupModalBase className="!w-[400px]">
      <VerificationComplete onComplete={close} />
    </MnemonicBackupModalBase>
  )
}
