import { FC, useState } from "react"

import { RecentSwaps } from "./recent/RecentSwaps"
import { SellForm } from "./sell/SellForm"
import { SellProgress } from "./sell/SellProgress"
import { SellReview } from "./sell/SellReview"
import { CrossChainSellProvider, useCrossChainSell } from "./sell/useCrossChainSell"
import { getCrossChainModalView, useCrossChainSellModal } from "./useCrossChainSellModal"

/** The screen for where the sell stands: the form, the review, or the run and its result. */
const CrossChainSellRouter: FC<{ onOpenRecent: () => void }> = ({ onOpenRecent }) => {
  const { options, review, execution } = useCrossChainSell()
  if (!options) return null
  if (!review) return <SellForm onOpenRecent={onOpenRecent} />
  return execution.state.status === "idle" ? (
    <SellReview />
  ) : (
    <SellProgress onOpenRecent={onOpenRecent} />
  )
}

/**
 * A sell, with Recent cross-chain swaps a link away: the sell stays mounted underneath (its form,
 * or its run), so coming back finds it as it was.
 */
const SellWithRecent = () => {
  const [isRecentOpen, setIsRecentOpen] = useState(false)
  return (
    <CrossChainSellProvider>
      {isRecentOpen ? (
        <RecentSwaps onBack={() => setIsRecentOpen(false)} />
      ) : (
        <CrossChainSellRouter onOpenRecent={() => setIsRecentOpen(true)} />
      )}
    </CrossChainSellProvider>
  )
}

/**
 * The modal's content: loaded on the first opening (`React.lazy` in `CrossChainSellModal`), with
 * the swap SDK and viem. Opened from an asset row it is a sell; from the "Swap needs attention"
 * notice, Recent cross-chain swaps.
 */
const CrossChainSellModalContent = () => {
  // Read once: every opening of the modal mounts fresh content.
  const [view] = useState(getCrossChainModalView)
  const { close } = useCrossChainSellModal()
  if (view?.kind === "recent") return <RecentSwaps onClose={close} />
  return <SellWithRecent />
}

export default CrossChainSellModalContent
