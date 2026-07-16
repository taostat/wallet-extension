import { X } from "@untitledui/icons/X"
import { ReactNode } from "react"
import { IconButton } from "taostats-ui"

type NotificationProps = {
  icon?: ReactNode
  title?: ReactNode
  description?: ReactNode
  action?: ReactNode
  onActionClick: () => void
  onClose?: () => void
}

export const DashboardNotification = ({
  icon,
  title,
  description,
  onClose,
  action,
  onActionClick,
}: NotificationProps) => {
  return (
    <div className="bg-app-bg mb-6 flex w-full items-center gap-3 rounded border border-white p-4 text-base">
      {icon && (
        <div className="text-fg-brand flex flex-col justify-center text-[38px]">{icon}</div>
      )}
      <div className="flex-grow">
        <span className="mr-2">{title}</span>
        <span className="text-fg-secondary">{description}</span>
      </div>
      {action && (
        <button
          type="button"
          className="bg-fg-brand h-[30px] whitespace-nowrap rounded-xl px-4 py-1 !text-sm text-black"
          onClick={onActionClick}
        >
          {action}
        </button>
      )}
      {onClose && (
        <IconButton onClick={onClose}>
          <X />
        </IconButton>
      )}
    </div>
  )
}
