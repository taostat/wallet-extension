import { TxProgress } from "../../../Transactions"
import { useBittensorStakeModal } from "../hooks/useBittensorStakeModal"
import { useBittensorStakeWizard } from "../hooks/useBittensorStakeWizard"

export const BittensorBondFollowUp = () => {
  const { close } = useBittensorStakeModal()
  const { hash, nativeToken } = useBittensorStakeWizard()

  if (!hash || !nativeToken?.networkId) return null

  return (
    <div className="size-full p-12 pt-24">
      <TxProgress hash={hash} networkIdOrHash={nativeToken.networkId} onClose={close} />
    </div>
  )
}
