import { classNames } from "@taostats-wallet/util"
import { FC, ReactNode } from "react"

import { TaostatsLogo } from "@taostats/theme/logos"

export const PopupLogoHeader: FC<{ right?: ReactNode; className?: string }> = ({
  right,
  className,
}) => (
  <header
    className={classNames("flex shrink-0 items-center justify-between px-2 pb-2 pt-0", className)}
  >
    <TaostatsLogo className="h-[15px] w-auto" />
    {right ? <div className="flex items-center gap-2">{right}</div> : null}
  </header>
)
