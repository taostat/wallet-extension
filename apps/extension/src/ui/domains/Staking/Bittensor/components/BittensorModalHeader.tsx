import { cn } from "@taostats-wallet/util"
import { ChevronLeft } from "@untitledui/icons/ChevronLeft"
import { X } from "@untitledui/icons/X"
import { FC, ReactNode } from "react"
import { IconButton } from "taostats-ui"

export const BittensorStakingModalHeader: FC<{
  title: ReactNode
  className?: string
  withClose?: boolean
  onBackClick?: () => void
  onCloseModal: () => void
}> = ({ title, className, withClose, onBackClick, onCloseModal }) => {
  return (
    <div
      className={cn("text-fg-secondary flex h-32 w-full shrink-0 items-center px-10", className)}
    >
      <IconButton onClick={onBackClick} className={cn(!onBackClick && "invisible")}>
        <ChevronLeft />
      </IconButton>
      <div className="grow text-center font-bold text-white">{title}</div>
      <IconButton onClick={onCloseModal} className={cn(!withClose && "invisible")}>
        <X />
      </IconButton>
    </div>
  )
}
