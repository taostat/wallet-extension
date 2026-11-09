import { VerificationComplete } from "@ui/domains/Mnemonic/VerificationComplete"

import { useMnemonicCreateModal } from "./context"
import { MnemonicCreateModalDialog } from "./Dialog"

export const Complete = () => {
  const { complete } = useMnemonicCreateModal()

  return (
    <MnemonicCreateModalDialog className="!w-[400px]">
      <VerificationComplete onComplete={complete} />
    </MnemonicCreateModalDialog>
  )
}
