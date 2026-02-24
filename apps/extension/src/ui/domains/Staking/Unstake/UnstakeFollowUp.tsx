import { TxProgress } from "../../Transactions"
import { useUnstakeModal } from "./useUnstakeModal"
import { useUnstakeWizard } from "./useUnstakeWizard"

export const UnstakeFollowUp = () => {
  const { close } = useUnstakeModal()
  const { hash, token } = useUnstakeWizard()

  if (!hash || !token?.networkId) return null

  return <TxProgress hash={hash} networkIdOrHash={token.networkId} onClose={close} />
}
