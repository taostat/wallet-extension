import { AlertCircle } from "@untitledui/icons/AlertCircle"
import { CheckCircle } from "@untitledui/icons/CheckCircle"
import { Loading01 } from "@untitledui/icons/Loading01"
import { XCircle } from "@untitledui/icons/XCircle"
import { ReactNode } from "react"

type NotificationType = "success" | "error" | "processing" | "warn"

export type NotificationProps = {
  type: NotificationType
  title: ReactNode
  subtitle?: ReactNode
  right?: ReactNode
}

const NotificationIcon = ({ type }: { type: NotificationType }) => {
  if (type === "success") return <CheckCircle className="text-fg-success h-8 w-8" />
  if (type === "warn") return <AlertCircle className="text-fg-orange h-8 w-8" />
  if (type === "error") return <XCircle className="text-fg-error h-8 w-8" />
  if (type === "processing")
    return <Loading01 className="text-fg-secondary animate-spin-slow h-8 w-8" />
  return null
}

export const Notification = ({ title, subtitle, type, right }: NotificationProps) => {
  return (
    <div className="gap-md flex items-center">
      <div>
        <NotificationIcon type={type} />
      </div>
      <div className="grow">
        <div className="text-fg-primary">{title}</div>
        {subtitle && <div className="text-fg-secondary mt-xxs text-sm">{subtitle}</div>}
      </div>
      {right}
    </div>
  )
}
