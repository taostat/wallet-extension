import { classNames } from "@taostats-wallet/util"
import { X } from "@untitledui/icons/X"
import { FC, ReactNode } from "react"

import { IconButton } from "./IconButton"

type ModalDialogProps = {
  className?: string
  title?: ReactNode
  centerTitle?: boolean
  onClose?: () => void
  children?: ReactNode
  id?: string
}

export const ModalDialog: FC<ModalDialogProps> = ({
  id,
  className,
  title,
  centerTitle,
  onClose,
  children,
}) => {
  return (
    <div
      id={id}
      className={classNames(
        "border-primary bg-app-bg text-fg-primary flex max-h-[100dvh] w-[42rem] max-w-[100dvw] flex-col overflow-hidden rounded-lg border",
        className,
      )}
      tabIndex={-1} // reset to prevent tab key from giving focus to elements below the modal
    >
      <header className="gap-md p-xl z-10 flex w-full items-center justify-between overflow-hidden">
        {!!centerTitle && !!onClose && (
          // placeholder to keep the title centered
          <IconButton className="invisible">
            <X />
          </IconButton>
        )}
        <h1
          className={classNames(
            "text-fg-primary flex-grow overflow-hidden text-ellipsis whitespace-nowrap text-base font-bold",
            centerTitle && "text-center",
          )}
        >
          {title}
        </h1>
        {!!onClose && (
          <IconButton onClick={onClose}>
            <X />
          </IconButton>
        )}
      </header>
      <div className="scrollable scrollable-800 p-xl flex-grow overflow-auto pt-0">{children}</div>
    </div>
  )
}
