import { classNames } from "@taostats-wallet/util"
import { ReactNode } from "react"

type OnboardDialogProps = {
  title?: string
  children: ReactNode
  className?: string
}

export const OnboardDialog = ({ title, children, className }: OnboardDialogProps) => (
  <div className={classNames("flex w-[40rem] flex-col items-center gap-6", className)}>
    <div
      className={classNames(
        "bg-fg-primary/5 transform-gpu backdrop-blur-xl",
        "flex w-full flex-col gap-5 rounded-lg p-6 text-left",
      )}
    >
      {title && <div className="text-lg font-medium text-white">{title}</div>}
      <div className={`text-fg-secondary`}>{children}</div>
    </div>
  </div>
)
