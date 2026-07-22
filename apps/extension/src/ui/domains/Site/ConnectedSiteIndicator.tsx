import { classNames } from "@taostats-wallet/util"
import { FC } from "react"

import { SiteConnectionStatus } from "./types"

export const ConnectedSiteIndicator: FC<{
  status: SiteConnectionStatus
  className?: string
}> = ({ status, className }) => {
  return (
    <div
      className={classNames(
        "flex h-4 w-4 items-center justify-center rounded-full border-2",
        status === "connected" && "border-fg-brand/30",
        status === "disconnected" && "border-brand-orange/30",
        status === "disabled" && "border-primary/20",
        className,
      )}
    >
      <div
        className={classNames(
          "h-2 w-2 rounded-full",
          status === "connected" && "bg-fg-brand",
          status === "disconnected" && "bg-brand-orange",
          status === "disabled" && "bg-disabled",
        )}
      ></div>
    </div>
  )
}
