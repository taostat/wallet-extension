import { classNames } from "@taostats-wallet/util"
import { ReactNode } from "react"
import { ModalDialog } from "taostats-ui"

import { useMnemonicCreateModal } from "./context"

export const MnemonicCreateModalDialog = ({
  children,
  title,
  className,
}: {
  children: ReactNode
  title?: string
  className?: string
}) => {
  const { cancel } = useMnemonicCreateModal()

  return (
    <ModalDialog title={title} className={classNames("w-[640px]", className)} onClose={cancel}>
      {children}
    </ModalDialog>
  )
}
