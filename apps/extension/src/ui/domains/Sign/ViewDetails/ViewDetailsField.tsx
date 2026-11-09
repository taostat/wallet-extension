import { classNames } from "@taostats-wallet/util"
import { FC, ReactNode } from "react"

export type ViewDetailsFieldProps = {
  label: ReactNode
  prewrap?: boolean
  breakAll?: boolean
  error?: string
  children?: ReactNode
}

export const ViewDetailsField: FC<ViewDetailsFieldProps> = ({ label, children, error }) =>
  error || children ? (
    <div className="mt-2">
      <div className="text-fg-secondary">{label}</div>
      <div className={classNames(error && "text-fg-orange")}>{error || children}</div>
    </div>
  ) : null
