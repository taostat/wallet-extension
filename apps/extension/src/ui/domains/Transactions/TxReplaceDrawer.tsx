import { HexString } from "@polkadot/util/types"
import { WalletTransaction } from "extension-core"
import { FC, useMemo } from "react"
import { Drawer, Modal, useOpenCloseWithData } from "taostats-ui"

import { IS_POPUP } from "@ui/util/constants"

import { TxReplaceType } from "./types"

type TxReplaceDrawerProps = {
  tx?: WalletTransaction
  type?: TxReplaceType // will open if set
  onClose?: (newTxHash?: HexString) => void
}

export const TxReplaceDrawer: FC<TxReplaceDrawerProps> = ({ tx, type, onClose }) => {
  const inputs = useMemo(() => (tx && type ? { tx, type } : undefined), [tx, type])
  const { isOpenReady } = useOpenCloseWithData(!!inputs, inputs)

  // can't use a drawer in dashbaord, render a modal instead
  if (!IS_POPUP) {
    return (
      <Modal isOpen={isOpenReady} anchor="center" onDismiss={onClose}>
        <div
          id="tx-main"
          className="border-grey-850 flex h-[60rem] max-h-[100dvh] w-[40rem] max-w-[100dvw] flex-col items-center overflow-hidden rounded border bg-black p-12"
        >
          {null}
        </div>
      </Modal>
    )
  }

  return (
    <Drawer
      isOpen={isOpenReady}
      anchor="bottom"
      containerId="main"
      onDismiss={onClose}
      className="bg-grey-800 flex w-full flex-col items-center rounded-t-xl p-12"
    >
      {null}
    </Drawer>
  )
}
