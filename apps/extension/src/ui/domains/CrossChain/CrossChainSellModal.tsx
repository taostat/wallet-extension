import { cn } from "@taostats-wallet/util"
import { Loading01 } from "@untitledui/icons/Loading01"
import { lazy, Suspense } from "react"
import { Modal } from "taostats-ui"

import { IS_POPUP, isSidePanel } from "@ui/util/constants"

import { CROSS_CHAIN_SELL_CONTAINER_ID } from "./constants"
import { useCrossChainSellModal } from "./useCrossChainSellModal"

// Its own chunk: the swap SDK and viem load when a sell is opened, never with the page. Written
// inline (not via IS_CROSS_CHAIN_SELL_BUILD) so webpack sees a constant and leaves the chunk out of
// builds with sells off.
const CrossChainSellModalContent =
  process.env.CROSS_CHAIN_SELL === "true"
    ? lazy(() => import("./CrossChainSellModalContent"))
    : null

const Loading = () => (
  <div className="flex size-full items-center justify-center">
    <Loading01 className="animate-spin-slow text-fg-secondary size-8" />
  </div>
)

/**
 * The cross-chain sell, opened from an asset's token row (`CrossChainSellButton`). Mounted once in
 * the side panel and once in the dashboard, as the staking modal is. Its content mounts on each
 * opening, so every sell starts fresh, and unmounts on close: the live status stops there, while a
 * swap already sent completes on its own.
 */
export const CrossChainSellModal = () => {
  const { isOpen, close } = useCrossChainSellModal()
  const isSidePanelSurface = isOpen && isSidePanel()

  return (
    <Modal
      containerId="main"
      isOpen={isOpen}
      onDismiss={close}
      className={isSidePanelSurface ? "h-full w-full self-stretch" : undefined}
    >
      <div
        id={CROSS_CHAIN_SELL_CONTAINER_ID} // acts as containerId for drawers
        className={cn(
          "relative flex max-h-[100dvh] max-w-[100dvw] flex-col overflow-hidden bg-black",
          isSidePanelSurface ? "h-full w-full" : "h-[600px] w-[400px]",
          !IS_POPUP && !isSidePanelSurface && "border-primary rounded border",
        )}
      >
        {isOpen && CrossChainSellModalContent ? (
          <Suspense fallback={<Loading />}>
            <CrossChainSellModalContent />
          </Suspense>
        ) : null}
      </div>
    </Modal>
  )
}
