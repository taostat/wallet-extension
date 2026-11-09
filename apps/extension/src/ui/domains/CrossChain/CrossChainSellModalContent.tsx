import { SellForm } from "./sell/SellForm"
import { SellProgress } from "./sell/SellProgress"
import { SellReview } from "./sell/SellReview"
import { CrossChainSellProvider, useCrossChainSell } from "./sell/useCrossChainSell"

/** The screen for where the sell stands: the form, the review, or the run and its result. */
const CrossChainSellRouter = () => {
  const { options, review, execution } = useCrossChainSell()
  if (!options) return null
  if (!review) return <SellForm />
  return execution.state.status === "idle" ? <SellReview /> : <SellProgress />
}

/**
 * The sell modal's content: loaded on the first opening (`React.lazy` in `CrossChainSellModal`),
 * with the swap SDK and viem.
 */
const CrossChainSellModalContent = () => (
  <CrossChainSellProvider>
    <CrossChainSellRouter />
  </CrossChainSellProvider>
)

export default CrossChainSellModalContent
