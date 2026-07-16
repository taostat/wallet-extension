import { X } from "@untitledui/icons/X"
import { FC, PropsWithChildren } from "react"
import { IconButton } from "taostats-ui"

import { useCopyAddressModal } from "./useCopyAddressModal"

type CopyAddressLayoutProps = PropsWithChildren & {
  title: string
}

export const CopyAddressLayout: FC<CopyAddressLayoutProps> = ({ title, children }) => {
  const { close } = useCopyAddressModal()

  return (
    <div
      id="copy-address-modal"
      className="relative flex h-full w-full flex-col overflow-hidden bg-black"
    >
      <div className="flex h-16 w-full shrink-0 items-center px-6">
        <div className="w-6"></div>
        <div className="text-fg-secondary grow text-center">{title}</div>
        <IconButton onClick={close}>
          <X />
        </IconButton>
      </div>
      <div className="grow overflow-hidden">{children}</div>
    </div>
  )
}
