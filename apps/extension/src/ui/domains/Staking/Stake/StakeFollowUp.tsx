import { TxProgress } from "../../Transactions"
import { useStakeModal } from "./hooks/useStakeModal"
import { useStakeWizard } from "./hooks/useStakeWizard"

export const StakeFollowUp = () => {
  const { close } = useStakeModal()
  const { hash, token } = useStakeWizard()

  if (!hash || !token?.networkId) return null

  return <TxProgress hash={hash} networkIdOrHash={token.networkId} onClose={close} />
}
